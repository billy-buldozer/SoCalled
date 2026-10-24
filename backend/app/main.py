
import asyncio
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import FastAPI, WebSocket, WebSocketDisconnect


app = FastAPI(title="SoCalled API")


# ==========================================
# STAN POKOJU
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


# ==========================================
# ENDPOINTY HTTP
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
# WEBSOCKET — KOMUNIKACJA
# ==========================================

@app.websocket("/ws/rooms/{room_id}")
async def room_websocket(
    websocket: WebSocket,
    room_id: str,
):
    if not re.fullmatch(r"[a-zA-Z0-9_-]{1,80}", room_id):
        await websocket.close(code=1008)
        return

    nickname = websocket.query_params.get(
        "nickname", ""
    ).strip()

    client_id = websocket.query_params.get(
        "client_id", ""
    ).strip()

    if (
        not nickname
        or len(nickname) > 32
        or not re.fullmatch(
            r"[a-zA-Z0-9_-]{1,80}", client_id
        )
    ):
        await websocket.close(code=1008)
        return

    room = await get_room(room_id)

    await websocket.accept()

    print(f"[CONNECT] {nickname} -> {room_id}")

    try:
        # Pobranie historii i dołączenie do pokoju
        async with room.lock:
            await websocket.send_json({
                "type": "history",
                "messages": list(room.messages),
            })

            room.connections.add(websocket)

        print(f"[JOIN] {nickname} -> {room_id}")

        while True:
            try:
                payload = await websocket.receive_json()
            except ValueError:
                continue

            if not isinstance(payload, dict):
                continue

            event_type = payload.get("type")

            # ==================================
            # HEARTBEAT — PING/PONG
            # ==================================

            if event_type == "ping":
                async with room.lock:
                    await websocket.send_json({
                        "type": "pong",
                    })

                continue

            # ==================================
            # NOWA WIADOMOŚĆ
            # ==================================

            if event_type == "send_message":
                text = payload.get("text")

                if not isinstance(text, str):
                    continue

                text = text.strip()

                if not 1 <= len(text) <= 2000:
                    async with room.lock:
                        await websocket.send_json({
                            "type": "error",
                            "message": (
                                "Wiadomość musi mieć "
                                "od 1 do 2000 znaków."
                            ),
                        })

                    continue

                message = {
                    "id": str(uuid4()),
                    "roomId": room_id,
                    "clientId": client_id,
                    "author": nickname,
                    "time": datetime.now(
                        timezone.utc
                    ).isoformat(),
                    "text": text,
                }

                event = {
                    "type": "message_created",
                    "message": message,
                }

                # Sekcja krytyczna pokoju
                async with room.lock:
                    room.messages.append(message)

                    if len(room.messages) > 200:
                        del room.messages[:-200]

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

                print(
                    f"[MESSAGE] room={room_id} "
                    f"user={nickname} "
                    f"id={message['id']}"
                )

    except WebSocketDisconnect:
        pass

    finally:
        async with room.lock:
            room.connections.discard(websocket)

        print(f"[LEAVE] {nickname} -> {room_id}")
