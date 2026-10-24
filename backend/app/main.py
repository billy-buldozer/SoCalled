
import asyncio
import base64
import binascii
import re

from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import FastAPI, WebSocket, WebSocketDisconnect


app = FastAPI(title="SoCalled API")


# ==========================================
# KONFIGURACJA
# ==========================================

MAX_MESSAGES = 200
MAX_MESSAGE_LENGTH = 2000
MAX_IMAGE_BYTES = 240_000

ALLOWED_ICONS = {
    "hash", "game", "code", "music",
    "camera", "coffee", "globe",
}

ROLE_ORDER = {
    "owner": 0,
    "moderator": 1,
    "member": 2,
}


# ==========================================
# POKOJE DOMYŚLNE
# ==========================================

DEFAULT_ROOMS = [
    {
        "id": "general",
        "name": "General",
        "icon": "hash",
        "description": "Główne miejsce spotkań społeczności SoCalled.",
        "topic": "Wszystko zaczyna się od rozmowy.",
    },
    {
        "id": "gaming",
        "name": "Gaming",
        "icon": "game",
        "description": "Gry, wspólne rozgrywki i dyskusje.",
        "topic": "Jeszcze jeden mecz?",
    },
    {
        "id": "dev",
        "name": "Dev Zone",
        "icon": "code",
        "description": "Programowanie, projekty i nowe technologie.",
        "topic": "Build something amazing.",
    },
    {
        "id": "music",
        "name": "Muzyka",
        "icon": "music",
        "description": "Dziel się ulubionymi utworami i albumami.",
        "topic": "Co dzisiaj gra w słuchawkach?",
    },
    {
        "id": "photo",
        "name": "Fotografia",
        "icon": "camera",
        "description": "Zdjęcia, inspiracje i kreatywne pomysły.",
        "topic": "Uchwyć chwilę.",
    },
    {
        "id": "offtopic",
        "name": "Off-topic",
        "icon": "coffee",
        "description": "Luźne rozmowy bez konkretnego tematu.",
        "topic": "Po prostu porozmawiajmy.",
    },
    {
        "id": "world",
        "name": "Odkrycia",
        "icon": "globe",
        "description": "Ciekawe linki, miejsca i znaleziska z internetu.",
        "topic": "Zawsze jest coś do odkrycia.",
    },
]


# ==========================================
# MODELE PAMIĘCI
# ==========================================

@dataclass(eq=False)
class ClientConnection:
    websocket: WebSocket
    room_id: str
    client_id: str
    nickname: str

    send_lock: asyncio.Lock = field(
        default_factory=asyncio.Lock
    )

    async def send(self, event: dict):
        async with self.send_lock:
            await self.websocket.send_json(event)


@dataclass
class RoomState:
    info: dict
    messages: list[dict] = field(default_factory=list)
    members: dict[str, dict] = field(default_factory=dict)

    connections: set[ClientConnection] = field(
        default_factory=set
    )

    lock: asyncio.Lock = field(
        default_factory=asyncio.Lock
    )


rooms: dict[str, RoomState] = {}

for data in DEFAULT_ROOMS:
    room_info = {
        **data,
        "image": None,
        "isPrivate": False,
        "ownerId": None,
    }

    rooms[room_info["id"]] = RoomState(info=room_info)


rooms_lock = asyncio.Lock()
all_connections: set[ClientConnection] = set()


# ==========================================
# FUNKCJE POMOCNICZE
# ==========================================

def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def is_valid_id(value) -> bool:
    return (
        isinstance(value, str)
        and re.fullmatch(
            r"[a-zA-Z0-9_-]{1,80}",
            value
        ) is not None
    )


def find_message(
    room: RoomState,
    message_id: str,
) -> dict | None:
    for message in room.messages:
        if message["id"] == message_id:
            return message

    return None


def is_member_online(
    room: RoomState,
    client_id: str,
) -> bool:
    return any(
        connection.client_id == client_id
        for connection in room.connections
    )


def online_count(room: RoomState) -> int:
    return len({
        connection.client_id
        for connection in room.connections
    })


def member_display_name(member: dict) -> str:
    return (
        member["nickname"]
        or member["username"]
    )


def ensure_member(
    room: RoomState,
    client_id: str,
    username: str,
) -> dict:
    member = room.members.get(client_id)

    if member is None:
        member = {
            "clientId": client_id,
            "username": username,
            "nickname": None,
            "role": (
                "owner"
                if room.info["ownerId"] == client_id
                else "member"
            ),
        }

        room.members[client_id] = member

    else:
        member["username"] = username

        if room.info["ownerId"] == client_id:
            member["role"] = "owner"

    return member


def members_snapshot(room: RoomState) -> list[dict]:
    result = []

    for member in room.members.values():
        result.append({
            **member,
            "displayName": member_display_name(member),
            "online": is_member_online(
                room,
                member["clientId"],
            ),
        })

    result.sort(
        key=lambda member: (
            ROLE_ORDER.get(member["role"], 9),
            not member["online"],
            member["displayName"].lower(),
        )
    )

    return result


def room_data(room: RoomState) -> dict:
    return {
        **room.info,
        "memberCount": len(room.members),
        "onlineCount": online_count(room),
    }


def room_snapshot() -> list[dict]:
    return [
        room_data(room)
        for room in rooms.values()
    ]


# ==========================================
# WALIDACJA ZDJĘCIA
# ==========================================

def valid_image(value) -> bool:
    if value is None:
        return True

    if not isinstance(value, str):
        return False

    if len(value) > 330_000:
        return False

    match = re.fullmatch(
        r"data:image/(png|jpeg|webp);base64,"
        r"([A-Za-z0-9+/]+={0,2})",
        value,
    )

    if not match:
        return False

    image_format = match.group(1)

    try:
        raw = base64.b64decode(
            match.group(2),
            validate=True,
        )
    except (binascii.Error, ValueError):
        return False

    if not raw or len(raw) > MAX_IMAGE_BYTES:
        return False

    if image_format == "png":
        return raw.startswith(
            b"\x89PNG\r\n\x1a\n"
        )

    if image_format == "jpeg":
        return raw.startswith(b"\xff\xd8\xff")

    if image_format == "webp":
        return (
            raw.startswith(b"RIFF")
            and raw[8:12] == b"WEBP"
        )

    return False


def validate_room_data(payload: dict) -> str | None:
    name = payload.get("name")
    description = payload.get("description")
    topic = payload.get("topic")
    icon = payload.get("icon")
    image = payload.get("image")

    if (
        not isinstance(name, str)
        or not 1 <= len(name.strip()) <= 28
    ):
        return "Nazwa pokoju musi mieć od 1 do 28 znaków."

    if (
        not isinstance(description, str)
        or len(description) > 300
    ):
        return "Opis może mieć maksymalnie 300 znaków."

    if (
        not isinstance(topic, str)
        or len(topic) > 100
    ):
        return "Temat może mieć maksymalnie 100 znaków."

    if icon not in ALLOWED_ICONS:
        return "Wybrano nieprawidłową ikonę."

    if not valid_image(image):
        return "Nieprawidłowy format lub rozmiar zdjęcia."

    return None


# ==========================================
# WYSYŁANIE ZDARZEŃ
# ==========================================

async def send_error(
    client: ClientConnection,
    message: str,
):
    await client.send({
        "type": "error",
        "message": message,
    })


async def broadcast(
    recipients: set[ClientConnection],
    event: dict,
):
    async def deliver(client: ClientConnection):
        try:
            await asyncio.wait_for(
                client.send(event),
                timeout=5,
            )
        except Exception:
            all_connections.discard(client)

            room = rooms.get(client.room_id)

            if room:
                room.connections.discard(client)

    await asyncio.gather(
        *[
            deliver(client)
            for client in tuple(recipients)
        ]
    )


async def broadcast_global(event: dict):
    await broadcast(all_connections, event)


async def broadcast_room(
    room: RoomState,
    event: dict,
):
    await broadcast(room.connections, event)


# ==========================================
# SYNCHRONIZACJA UCZESTNIKÓW
# ==========================================

async def publish_presence(
    room_id: str,
    room: RoomState,
    request_id=None,
    updated_by=None,
):
    async with room.lock:
        event = {
            "type": "room_presence",
            "roomId": room_id,
            "members": members_snapshot(room),
            "memberCount": len(room.members),
            "onlineCount": online_count(room),
            "requestId": request_id,
            "updatedBy": updated_by,
        }

    # Informujemy wszystkich o liczbie osób.
    # Lista uczestników służy do widoku pokoju.
    await broadcast_global(event)


# ==========================================
# ENDPOINTY HTTP
# ==========================================

@app.get("/")
async def home():
    return {
        "application": "SoCalled",
        "status": "running",
        "version": "0.6",
    }


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/rooms")
async def list_rooms():
    async with rooms_lock:
        return room_snapshot()


# ==========================================
# TWORZENIE POKOJU
# ==========================================

async def handle_create_room(
    client: ClientConnection,
    payload: dict,
):
    name = payload.get("name")
    is_private = payload.get("isPrivate", False)

    if not isinstance(name, str):
        await send_error(
            client,
            "Podaj nazwę pokoju.",
        )
        return

    name = name.strip()

    if not 1 <= len(name) <= 28:
        await send_error(
            client,
            "Nazwa musi mieć od 1 do 28 znaków.",
        )
        return

    if not isinstance(is_private, bool):
        await send_error(
            client,
            "Nieprawidłowy typ pokoju.",
        )
        return

    room_id = "room-" + uuid4().hex[:16]

    info = {
        "id": room_id,
        "name": name,
        "icon": "hash",
        "description": "Nowy pokój utworzony w SoCalled.",
        "topic": "Tutaj zaczyna się nowa rozmowa.",
        "image": None,
        "isPrivate": is_private,
        "ownerId": client.client_id,
    }

    room = RoomState(info=info)

    ensure_member(
        room,
        client.client_id,
        client.nickname,
    )

    async with rooms_lock:
        rooms[room_id] = room

    await broadcast_global({
        "type": "room_created",
        "room": room_data(room),
        "createdBy": client.client_id,
        "requestId": payload.get("requestId"),
    })

    await publish_presence(room_id, room)

    print(
        f"[ROOM CREATE] {room_id} "
        f"by {client.nickname}"
    )


# ==========================================
# PERSONALIZACJA POKOJU
# ==========================================

async def handle_update_room(
    client: ClientConnection,
    room: RoomState,
    payload: dict,
):
    if payload.get("roomId") != client.room_id:
        await send_error(
            client,
            "Możesz zmieniać tylko aktualny pokój.",
        )
        return

    error = validate_room_data(payload)

    if error:
        await send_error(client, error)
        return

    async with room.lock:
        owner_id = room.info["ownerId"]

        if owner_id not in (None, client.client_id):
            error = (
                "Tylko właściciel może edytować ten pokój."
            )

        else:
            error = None

            if owner_id is None:
                room.info["ownerId"] = client.client_id

            member = ensure_member(
                room,
                client.client_id,
                client.nickname,
            )

            member["role"] = "owner"

            room.info["name"] = payload["name"].strip()
            room.info["description"] = (
                payload["description"].strip()
            )
            room.info["topic"] = payload["topic"].strip()
            room.info["icon"] = payload["icon"]
            room.info["image"] = payload.get("image")

            updated = room_data(room)

    if error:
        await send_error(client, error)
        return

    await broadcast_global({
        "type": "room_updated",
        "room": updated,
        "updatedBy": client.client_id,
        "requestId": payload.get("requestId"),
    })

    await publish_presence(client.room_id, room)

    print(
        f"[ROOM UPDATE] {client.room_id} "
        f"by {client.nickname}"
    )


# ==========================================
# ZMIANA NICKU W POKOJU
# ==========================================

async def handle_set_room_nickname(
    client: ClientConnection,
    room: RoomState,
    payload: dict,
):
    target_id = payload.get("targetId")
    nickname = payload.get("nickname")

    if not is_valid_id(target_id):
        return

    if not isinstance(nickname, str):
        return

    nickname = nickname.strip()

    if len(nickname) > 32:
        await send_error(
            client,
            "Nick może mieć maksymalnie 32 znaki.",
        )
        return

    async with room.lock:
        target = room.members.get(target_id)

        is_owner = (
            room.info["ownerId"] == client.client_id
        )

        if target is None:
            error = "Nie znaleziono uczestnika."

        elif (
            target_id != client.client_id
            and not is_owner
        ):
            error = (
                "Nie możesz zmieniać nicków "
                "innych uczestników."
            )

        else:
            error = None

            # Pusty nick przywraca nazwę podstawową.
            target["nickname"] = nickname or None
            display_name = member_display_name(target)

            # Aktualizujemy też podpisy starych
            # wiadomości tego uczestnika.
            for message in room.messages:
                if message["clientId"] == target_id:
                    message["author"] = display_name

    if error:
        await send_error(client, error)
        return

    await broadcast_global({
        "type": "message_author_changed",
        "roomId": client.room_id,
        "clientId": target_id,
        "author": display_name,
    })

    await publish_presence(
        client.room_id,
        room,
        request_id=payload.get("requestId"),
        updated_by=client.client_id,
    )

    print(
        f"[NICK] room={client.room_id} "
        f"target={target_id} -> {display_name}"
    )


# ==========================================
# NADAWANIE ROLI MODERATORA
# ==========================================

async def handle_set_member_role(
    client: ClientConnection,
    room: RoomState,
    payload: dict,
):
    target_id = payload.get("targetId")
    role = payload.get("role")

    if not is_valid_id(target_id):
        return

    if role not in ("member", "moderator"):
        await send_error(
            client,
            "Można nadać rolę moderatora lub uczestnika.",
        )
        return

    async with room.lock:
        target = room.members.get(target_id)

        if room.info["ownerId"] != client.client_id:
            error = "Tylko właściciel może nadawać role."

        elif target is None:
            error = "Nie znaleziono uczestnika."

        elif target["role"] == "owner":
            error = "Nie można zmienić roli właściciela."

        else:
            error = None
            target["role"] = role

    if error:
        await send_error(client, error)
        return

    await publish_presence(
        client.room_id,
        room,
        request_id=payload.get("requestId"),
        updated_by=client.client_id,
    )

    print(
        f"[ROLE] room={client.room_id} "
        f"target={target_id} -> {role}"
    )


# ==========================================
# WYSYŁANIE WIADOMOŚCI
# ==========================================

async def handle_send_message(
    client: ClientConnection,
    room: RoomState,
    payload: dict,
):
    text = payload.get("text")

    if not isinstance(text, str):
        return

    text = text.strip()

    if not 1 <= len(text) <= MAX_MESSAGE_LENGTH:
        await send_error(
            client,
            "Wiadomość musi mieć od 1 do 2000 znaków.",
        )
        return

    async with room.lock:
        member = ensure_member(
            room,
            client.client_id,
            client.nickname,
        )

        message = {
            "id": str(uuid4()),
            "roomId": client.room_id,
            "clientId": client.client_id,
            "author": member_display_name(member),
            "time": utc_now(),
            "editedAt": None,
            "text": text,
        }

        room.messages.append(message)

        if len(room.messages) > MAX_MESSAGES:
            del room.messages[:-MAX_MESSAGES]

        await broadcast_room(
            room,
            {
                "type": "message_created",
                "message": dict(message),
            },
        )


# ==========================================
# EDYCJA WIADOMOŚCI
# ==========================================

async def handle_edit_message(
    client: ClientConnection,
    room: RoomState,
    payload: dict,
):
    message_id = payload.get("message_id")
    new_text = payload.get("text")

    if (
        not isinstance(message_id, str)
        or not isinstance(new_text, str)
    ):
        return

    new_text = new_text.strip()

    if not 1 <= len(new_text) <= MAX_MESSAGE_LENGTH:
        await send_error(
            client,
            "Nowa treść musi mieć od 1 do 2000 znaków.",
        )
        return

    async with room.lock:
        message = find_message(room, message_id)

        if message is None:
            error = "Nie znaleziono wiadomości."

        elif message["clientId"] != client.client_id:
            error = (
                "Możesz edytować tylko własne wiadomości."
            )

        else:
            error = None

            message["text"] = new_text
            message["editedAt"] = utc_now()

            latest = (
                dict(room.messages[-1])
                if room.messages else None
            )

            await broadcast_room(
                room,
                {
                    "type": "message_updated",
                    "message": dict(message),
                    "lastMessage": latest,
                },
            )

    if error:
        await send_error(client, error)


# ==========================================
# USUWANIE I MODERACJA WIADOMOŚCI
# ==========================================

async def handle_delete_message(
    client: ClientConnection,
    room: RoomState,
    payload: dict,
):
    message_id = payload.get("message_id")

    if not isinstance(message_id, str):
        return

    async with room.lock:
        message = find_message(room, message_id)

        member = room.members.get(client.client_id)

        role = (
            member["role"]
            if member else "member"
        )

        can_moderate = (
            role in ("owner", "moderator")
        )

        if message is None:
            error = "Nie znaleziono wiadomości."

        elif (
            message["clientId"] != client.client_id
            and not can_moderate
        ):
            error = (
                "Nie masz uprawnień do usunięcia "
                "tej wiadomości."
            )

        else:
            error = None

            room.messages.remove(message)

            latest = (
                dict(room.messages[-1])
                if room.messages else None
            )

            await broadcast_room(
                room,
                {
                    "type": "message_deleted",
                    "roomId": client.room_id,
                    "messageId": message_id,
                    "lastMessage": latest,
                },
            )

    if error:
        await send_error(client, error)


# ==========================================
# WEBSOCKET — POŁĄCZENIE
# ==========================================

@app.websocket("/ws/rooms/{room_id}")
async def room_websocket(
    websocket: WebSocket,
    room_id: str,
):
    if not is_valid_id(room_id):
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
        or not is_valid_id(client_id)
    ):
        await websocket.close(code=1008)
        return

    async with rooms_lock:
        room = rooms.get(room_id)

        if room is not None:
            snapshot = room_snapshot()

    if room is None:
        await websocket.close(code=1008)
        return

    await websocket.accept()

    client = ClientConnection(
        websocket=websocket,
        room_id=room_id,
        client_id=client_id,
        nickname=nickname,
    )

    try:
        # ==================================
        # DOŁĄCZENIE DO POKOJU
        # ==================================

        async with room.lock:
            ensure_member(
                room,
                client_id,
                nickname,
            )

            await client.send({
                "type": "rooms_snapshot",
                "rooms": snapshot,
            })

            await client.send({
                "type": "history",
                "messages": [
                    dict(message)
                    for message in room.messages
                ],
            })

            room.connections.add(client)
            all_connections.add(client)

        await publish_presence(room_id, room)

        print(f"[JOIN] {nickname} -> {room_id}")

        # ==================================
        # ODBIERANIE ZDARZEŃ
        # ==================================

        while True:
            try:
                payload = await websocket.receive_json()
            except ValueError:
                continue

            if not isinstance(payload, dict):
                continue

            event_type = payload.get("type")

            if event_type == "ping":
                await client.send({
                    "type": "pong",
                })

            elif event_type == "send_message":
                await handle_send_message(
                    client, room, payload
                )

            elif event_type == "edit_message":
                await handle_edit_message(
                    client, room, payload
                )

            elif event_type == "delete_message":
                await handle_delete_message(
                    client, room, payload
                )

            elif event_type == "create_room":
                await handle_create_room(
                    client, payload
                )

            elif event_type == "update_room":
                await handle_update_room(
                    client, room, payload
                )

            elif event_type == "set_room_nickname":
                await handle_set_room_nickname(
                    client, room, payload
                )

            elif event_type == "set_member_role":
                await handle_set_member_role(
                    client, room, payload
                )

    except WebSocketDisconnect:
        pass

    finally:
        # Użytkownik pozostaje na liście
        # uczestników, ale ma status offline.
        room.connections.discard(client)
        all_connections.discard(client)

        await publish_presence(room_id, room)

        print(f"[LEAVE] {nickname} -> {room_id}")
