
import asyncio
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import FastAPI, WebSocket, WebSocketDisconnect


app = FastAPI(title="SoCalled API")


# ==========================================
# PAMIĘĆ I SYNCHRONIZACJA POKOJÓW
# ==========================================

@dataclass
class RoomState:
    connections: set[WebSocket] = field(default_factory=set)
    messages: list[dict] = field(default_factory=list)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)


rooms: dict[str, RoomState] = {}
rooms_lock = asyncio.Lock()


async def get_room(room_id: str) -> RoomState:
    async with rooms_lock:
        if room_id not in rooms:
            rooms[room_id] = RoomState()

        return rooms[room_id]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ==========================================
# ROZSYŁANIE ZDARZEŃ
# ==========================================

async def broadcast(
    room: RoomState,
    event: dict,
) -> None:
    """
    Wywołujemy wewnątrz room.lock.

    Dzięki temu zdarzenia z jednego pokoju
    są wysyłane w tej samej kolejności.
    """

    disconnected = []

    for client in tuple(room.connections):
        try:
            await client.send_json(event)

        except (
            RuntimeError,
            OSError,
            WebSocketDisconnect,
        ):
            disconnected.append(client)

    for client in disconnected:
        room.connections.discard(client)


async def send_error(
    websocket: WebSocket,
    message: str,
) -> None:
    await websocket.send_json({
        "type": "error",
        "message": message,
    })


def find_message(
    room: RoomState,
    message_id: str,
) -> dict | None:
    for message in room.messages:
        if message["id"] == message_id:
            return message

    return None


# ==========================================
# PODSTAWOWE ENDPOINTY
# ==========================================

@app.get("/")
def home():
    return {
        "application": "SoCalled",
        "status": "running",
        "message": "Welcome to SoCalled!",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


# ==========================================
# WEBSOCKET
# ==========================================

@app.websocket("/ws/rooms/{room_id}")
async def room_websocket(
    websocket: WebSocket,
    room_id: str,
):
    # Identyfikator pokoju
    if not re.fullmatch(
        r"[a-zA-Z0-9_-]{1,80}",
        room_id,
    ):
        await websocket.close(code=1008)
        return

    nickname = websocket.query_params.get(
        "nickname", ""
    ).strip()

    client_id = websocket.query_params.get(
        "client_id", ""
    ).strip()

    # Tymczasowa identyfikacja użytkownika
    if (
        not nickname
        or len(nickname) > 32
        or not re.fullmatch(
            r"[a-zA-Z0-9_-]{1,80}",
            client_id,
        )
    ):
        await websocket.close(code=1008)
        return

    room = await get_room(room_id)

    await websocket.accept()

    print(f"[CONNECT] {nickname} -> {room_id}")

    try:
        # ==================================
        # DOŁĄCZANIE I HISTORIA
        # ==================================

        async with room.lock:
            await websocket.send_json({
                "type": "history",
                "messages": [
                    dict(message)
                    for message in room.messages
                ],
            })

            room.connections.add(websocket)

        print(f"[JOIN] {nickname} -> {room_id}")

        # ==================================
        # GŁÓWNA PĘTLA WEBSOCKET
        # ==================================

        while True:
            try:
                payload = await websocket.receive_json()
            except ValueError:
                continue

            if not isinstance(payload, dict):
                continue

            event_type = payload.get("type")

            # ==================================
            # HEARTBEAT
            # ==================================

            if event_type == "ping":
                async with room.lock:
                    await websocket.send_json({
                        "type": "pong",
                    })

                continue

            # ==================================
            # WYSYŁANIE WIADOMOŚCI
            # ==================================

            if event_type == "send_message":
                text = payload.get("text")

                if not isinstance(text, str):
                    continue

                text = text.strip()

                if not 1 <= len(text) <= 2000:
                    async with room.lock:
                        await send_error(
                            websocket,
                            "Wiadomość musi mieć od 1 "
                            "do 2000 znaków.",
                        )
                    continue

                message = {
                    "id": str(uuid4()),
                    "roomId": room_id,
                    "clientId": client_id,
                    "author": nickname,
                    "time": utc_now(),
                    "editedAt": None,
                    "text": text,
                }

                async with room.lock:
                    room.messages.append(message)

                    # Limit historii prototypu
                    if len(room.messages) > 200:
                        del room.messages[:-200]

                    await broadcast(
                        room,
                        {
                            "type": "message_created",
                            "message": dict(message),
                        },
                    )

                print(
                    f"[CREATE] room={room_id} "
                    f"user={nickname} "
                    f"id={message['id']}"
                )

                continue

            # ==================================
            # EDYTOWANIE WIADOMOŚCI
            # ==================================

            if event_type == "edit_message":
                message_id = payload.get("message_id")
                new_text = payload.get("text")

                if (
                    not isinstance(message_id, str)
                    or not isinstance(new_text, str)
                ):
                    continue

                new_text = new_text.strip()

                if not 1 <= len(new_text) <= 2000:
                    async with room.lock:
                        await send_error(
                            websocket,
                            "Nowa treść musi mieć od 1 "
                            "do 2000 znaków.",
                        )
                    continue

                async with room.lock:
                    message = find_message(
                        room,
                        message_id,
                    )

                    if message is None:
                        await send_error(
                            websocket,
                            "Nie znaleziono wiadomości.",
                        )
                        continue

                    # Właściciel wiadomości
                    if message["clientId"] != client_id:
                        await send_error(
                            websocket,
                            "Możesz edytować tylko "
                            "własne wiadomości.",
                        )
                        continue

                    # Modyfikacja w sekcji krytycznej
                    message["text"] = new_text
                    message["editedAt"] = utc_now()

                    latest = (
                        dict(room.messages[-1])
                        if room.messages else None
                    )

                    await broadcast(
                        room,
                        {
                            "type": "message_updated",
                            "message": dict(message),
                            "lastMessage": latest,
                        },
                    )

                print(
                    f"[EDIT] room={room_id} "
                    f"user={nickname} "
                    f"id={message_id}"
                )

                continue

            # ==================================
            # USUWANIE WIADOMOŚCI
            # ==================================

            if event_type == "delete_message":
                message_id = payload.get("message_id")

                if not isinstance(message_id, str):
                    continue

                async with room.lock:
                    message = find_message(
                        room,
                        message_id,
                    )

                    if message is None:
                        await send_error(
                            websocket,
                            "Nie znaleziono wiadomości.",
                        )
                        continue

                    if message["clientId"] != client_id:
                        await send_error(
                            websocket,
                            "Możesz usunąć tylko "
                            "własne wiadomości.",
                        )
                        continue

                    # Usuwamy rekord z pamięci
                    room.messages.remove(message)

                    latest = (
                        dict(room.messages[-1])
                        if room.messages else None
                    )

                    await broadcast(
                        room,
                        {
                            "type": "message_deleted",
                            "messageId": message_id,
                            "roomId": room_id,
                            "lastMessage": latest,
                        },
                    )

                print(
                    f"[DELETE] room={room_id} "
                    f"user={nickname} "
                    f"id={message_id}"
                )

                continue

    except WebSocketDisconnect:
        pass

    finally:
        async with room.lock:
            room.connections.discard(websocket)

        print(f"[LEAVE] {nickname} -> {room_id}")
