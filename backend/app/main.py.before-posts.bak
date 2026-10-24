
import asyncio
import base64
import binascii
import re

from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from backend.app.video_uploads import (
    router as video_router,
    video_exists,
)


app = FastAPI(title="SoCalled API")
app.include_router(video_router)


# ==========================================
# KONFIGURACJA
# ==========================================

MAX_MESSAGES = 200
MAX_MESSAGE_LENGTH = 2000
MAX_IMAGE_BYTES = 180_000
MAX_IMAGE_DATA_LENGTH = 245_000
MAX_REPLY_PREVIEW = 140

ALLOWED_ICONS = {
    "hash", "game", "code", "music",
    "camera", "coffee", "globe",
}

ALLOWED_REACTIONS = {
    "❤️", "😂", "🔥", "👍", "😮", "🎉",
}

ROLE_ORDER = {
    "owner": 0,
    "moderator": 1,
    "member": 2,
}


# ==========================================
# DOMYŚLNE POKOJE
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
# STRUKTURY DANYCH
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

    messages: list[dict] = field(
        default_factory=list
    )

    members: dict[str, dict] = field(
        default_factory=dict
    )

    connections: set[ClientConnection] = field(
        default_factory=set
    )

    typing_ids: set[str] = field(
        default_factory=set
    )

    lock: asyncio.Lock = field(
        default_factory=asyncio.Lock
    )


# ==========================================
# STAN SERWERA
# ==========================================

rooms: dict[str, RoomState] = {}

for data in DEFAULT_ROOMS:
    info = {
        **data,
        "image": None,
        "isPrivate": False,
        "ownerId": None,
    }

    rooms[info["id"]] = RoomState(info=info)


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
            value,
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
    return member["nickname"] or member["username"]


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


def message_preview(message: dict | None) -> str:
    if message is None:
        return "Brak wiadomości"

    text = message.get("text", "")

    if message.get("videoId"):
        return f"🎬 {text}" if text else "🎬 Film"

    if message.get("image"):
        return f"📷 {text}" if text else "📷 Zdjęcie"

    return text


# ==========================================
# WALIDACJA ZDJĘĆ
# ==========================================

def valid_image(value) -> bool:
    if value is None:
        return True

    if not isinstance(value, str):
        return False

    if len(value) > MAX_IMAGE_DATA_LENGTH:
        return False

    match = re.fullmatch(
        r"data:image/(png|jpeg|webp);base64,"
        r"([A-Za-z0-9+/]+={0,2})",
        value,
    )

    if not match:
        return False

    try:
        raw = base64.b64decode(
            match.group(2),
            validate=True,
        )
    except (binascii.Error, ValueError):
        return False

    if not raw or len(raw) > MAX_IMAGE_BYTES:
        return False

    image_format = match.group(1)

    if image_format == "png":
        return raw.startswith(b"\x89PNG\r\n\x1a\n")

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
        return "Nieprawidłowa ikona."

    if not valid_image(image):
        return "Nieprawidłowe zdjęcie pokoju."

    return None


# ==========================================
# CYTOWANIE WIADOMOŚCI
# ==========================================

def reply_snapshot(message: dict) -> dict:
    text = message["text"]

    if message.get("videoId"):
        text = (
            "🎬 Film"
            + (f" — {text}" if text else "")
        )

    elif message.get("image"):
        text = (
            "📷 Zdjęcie"
            + (f" — {text}" if text else "")
        )

    return {
        "id": message["id"],
        "clientId": message["clientId"],
        "author": message["author"],
        "text": text[:MAX_REPLY_PREVIEW],
        "deleted": False,
    }


def update_reply_snapshots(
    room: RoomState,
    source_id: str,
    source: dict | None,
) -> list[dict]:
    changes = []

    for message in room.messages:
        reply = message.get("replyTo")

        if not reply or reply["id"] != source_id:
            continue

        if source is None:
            reply["text"] = "Wiadomość usunięta"
            reply["deleted"] = True

        else:
            updated = reply_snapshot(source)

            reply["author"] = updated["author"]
            reply["text"] = updated["text"]
            reply["deleted"] = False

        changes.append({
            "messageId": message["id"],
            "replyTo": dict(reply),
        })

    return changes


# ==========================================
# REAKCJE I STATUS PISANIA
# ==========================================

def copy_reactions(message: dict) -> dict:
    return {
        emoji: list(user_ids)
        for emoji, user_ids in message.get(
            "reactions", {}
        ).items()
    }


def typing_snapshot(room: RoomState) -> list[dict]:
    result = []

    for client_id in room.typing_ids:
        member = room.members.get(client_id)

        if (
            member is None
            or not is_member_online(room, client_id)
        ):
            continue

        result.append({
            "clientId": client_id,
            "displayName": member_display_name(member),
        })

    return result


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

            if room is not None:
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


async def publish_typing(
    room_id: str,
    room: RoomState,
):
    async with room.lock:
        event = {
            "type": "typing_status",
            "roomId": room_id,
            "users": typing_snapshot(room),
        }

    await broadcast_room(room, event)


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

    await broadcast_global(event)


# ==========================================
# HTTP
# ==========================================

@app.get("/")
async def home():
    return {
        "application": "SoCalled",
        "status": "running",
        "version": "0.10",
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
        await send_error(client, "Podaj nazwę pokoju.")
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

        if owner_id not in (
            None,
            client.client_id,
        ):
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


# ==========================================
# NICKI UCZESTNIKÓW
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

            target["nickname"] = nickname or None
            display_name = member_display_name(target)

            for message in room.messages:
                if message["clientId"] == target_id:
                    message["author"] = display_name

                reply = message.get("replyTo")

                if (
                    reply
                    and reply.get("clientId") == target_id
                    and not reply.get("deleted")
                ):
                    reply["author"] = display_name

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


# ==========================================
# NADAWANIE RÓL
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
        await send_error(client, "Nieprawidłowa rola.")
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


# ==========================================
# NOWA WIADOMOŚĆ — TEKST / ZDJĘCIE / FILM
# ==========================================

async def handle_send_message(
    client: ClientConnection,
    room: RoomState,
    payload: dict,
):
    text = payload.get("text", "")
    image = payload.get("image")
    video_id = payload.get("video_id")
    reply_id = payload.get("reply_to")

    if not isinstance(text, str):
        await send_error(
            client,
            "Nieprawidłowa treść wiadomości.",
        )
        return

    text = text.strip()

    if len(text) > MAX_MESSAGE_LENGTH:
        await send_error(
            client,
            "Wiadomość jest za długa.",
        )
        return

    if not valid_image(image):
        await send_error(
            client,
            "Nieprawidłowe lub zbyt duże zdjęcie.",
        )
        return

    if video_id is not None:
        if not video_exists(video_id):
            await send_error(
                client,
                "Nie znaleziono przesłanego filmu.",
            )
            return

    if image is not None and video_id is not None:
        await send_error(
            client,
            "Wyślij zdjęcie albo film, nie oba naraz.",
        )
        return

    if not text and image is None and video_id is None:
        await send_error(
            client,
            "Dodaj tekst, zdjęcie lub film.",
        )
        return

    if (
        reply_id is not None
        and not isinstance(reply_id, str)
    ):
        await send_error(
            client,
            "Nieprawidłowa wiadomość do odpowiedzi.",
        )
        return

    async with room.lock:
        member = ensure_member(
            room,
            client.client_id,
            client.nickname,
        )

        reply_to = None

        if reply_id:
            original = find_message(room, reply_id)

            if original is None:
                error = (
                    "Nie można odpowiedzieć na "
                    "usuniętą wiadomość."
                )
            else:
                error = None
                reply_to = reply_snapshot(original)
        else:
            error = None

        if error is None:
            message = {
                "id": str(uuid4()),
                "roomId": client.room_id,
                "clientId": client.client_id,
                "author": member_display_name(member),
                "time": utc_now(),
                "editedAt": None,
                "text": text,
                "image": image,

                # NOWOŚĆ: identyfikator pliku
                # zapisanego wcześniej przez HTTP.
                "videoId": video_id,

                "replyTo": reply_to,
                "reactions": {},
                "forwardedFrom": None,
            }

            room.messages.append(message)

            if len(room.messages) > MAX_MESSAGES:
                del room.messages[:-MAX_MESSAGES]

            room.typing_ids.discard(client.client_id)

            await broadcast_room(
                room,
                {
                    "type": "message_created",
                    "message": dict(message),
                },
            )

    if error:
        await send_error(client, error)
        return

    await publish_typing(client.room_id, room)


# ==========================================
# PRZEKAZYWANIE WIADOMOŚCI
# ==========================================

async def handle_forward_message(
    client: ClientConnection,
    source_room: RoomState,
    payload: dict,
):
    message_id = payload.get("message_id")
    target_room_id = payload.get("target_room_id")
    request_id = payload.get("requestId")

    if not is_valid_id(message_id):
        await send_error(
            client,
            "Nieprawidłowy identyfikator wiadomości.",
        )
        return

    if not is_valid_id(target_room_id):
        await send_error(
            client,
            "Wybierz prawidłowy pokój docelowy.",
        )
        return

    if target_room_id == client.room_id:
        await send_error(
            client,
            "Wybierz inny pokój niż obecny.",
        )
        return

    async with rooms_lock:
        target_room = rooms.get(target_room_id)

    if target_room is None:
        await send_error(
            client,
            "Nie znaleziono pokoju docelowego.",
        )
        return

    async with source_room.lock:
        original = find_message(
            source_room,
            message_id,
        )

        if original is None:
            source_data = None
        else:
            source_data = {
                "text": original["text"],
                "image": original.get("image"),
                "videoId": original.get("videoId"),
                "author": original["author"],
                "roomId": client.room_id,
                "roomName": source_room.info["name"],
                "messageId": original["id"],
            }

    if source_data is None:
        await send_error(
            client,
            "Wiadomość została usunięta.",
        )
        return

    async with target_room.lock:
        target_member = target_room.members.get(
            client.client_id
        )

        sender_name = (
            member_display_name(target_member)
            if target_member
            else client.nickname
        )

        forwarded = {
            "id": str(uuid4()),
            "roomId": target_room_id,
            "clientId": client.client_id,
            "author": sender_name,
            "time": utc_now(),
            "editedAt": None,

            "text": source_data["text"],
            "image": source_data["image"],

            # Przekazujemy identyfikator tego samego
            # pliku wideo, bez kopiowania go na dysku.
            "videoId": source_data["videoId"],

            "replyTo": None,
            "reactions": {},

            "forwardedFrom": {
                "roomId": source_data["roomId"],
                "roomName": source_data["roomName"],
                "author": source_data["author"],
                "messageId": source_data["messageId"],
            },
        }

        target_room.messages.append(forwarded)

        if len(target_room.messages) > MAX_MESSAGES:
            del target_room.messages[:-MAX_MESSAGES]

        await broadcast_room(
            target_room,
            {
                "type": "message_created",
                "message": dict(forwarded),
            },
        )

    await broadcast_global({
        "type": "room_activity",
        "roomId": target_room_id,
        "preview": message_preview(forwarded),
        "time": forwarded["time"],
    })

    await client.send({
        "type": "message_forwarded",
        "requestId": request_id,
        "targetRoomId": target_room_id,
        "targetRoomName": target_room.info["name"],
        "messageId": forwarded["id"],
    })


# ==========================================
# EDYCJA WIADOMOŚCI / PODPISU
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

    if len(new_text) > MAX_MESSAGE_LENGTH:
        await send_error(
            client,
            "Nowa treść jest za długa.",
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

        elif (
            not new_text
            and not message.get("image")
            and not message.get("videoId")
        ):
            error = (
                "Wiadomość tekstowa nie może być pusta."
            )

        else:
            error = None

            message["text"] = new_text
            message["editedAt"] = utc_now()

            changes = update_reply_snapshots(
                room,
                message_id,
                message,
            )

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

            for change in changes:
                await broadcast_room(
                    room,
                    {
                        "type": "message_reply_updated",
                        **change,
                    },
                )

    if error:
        await send_error(client, error)


# ==========================================
# USUWANIE WIADOMOŚCI
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

        can_moderate = role in (
            "owner",
            "moderator",
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

            changes = update_reply_snapshots(
                room,
                message_id,
                None,
            )

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

            for change in changes:
                await broadcast_room(
                    room,
                    {
                        "type": "message_reply_updated",
                        **change,
                    },
                )

    if error:
        await send_error(client, error)


# ==========================================
# REAKCJE EMOJI
# ==========================================

async def handle_toggle_reaction(
    client: ClientConnection,
    room: RoomState,
    payload: dict,
):
    message_id = payload.get("message_id")
    emoji = payload.get("emoji")

    if not isinstance(message_id, str):
        return

    if (
        not isinstance(emoji, str)
        or emoji not in ALLOWED_REACTIONS
    ):
        await send_error(
            client,
            "Nieobsługiwana reakcja.",
        )
        return

    async with room.lock:
        message = find_message(
            room,
            message_id,
        )

        if message is None:
            error = "Nie znaleziono wiadomości."

        else:
            error = None

            reactions = message.setdefault(
                "reactions", {}
            )

            users = reactions.setdefault(
                emoji, []
            )

            if client.client_id in users:
                users.remove(client.client_id)
            else:
                users.append(client.client_id)

            if not users:
                del reactions[emoji]

            await broadcast_room(
                room,
                {
                    "type": "message_reactions_updated",
                    "messageId": message_id,
                    "reactions": copy_reactions(message),
                },
            )

    if error:
        await send_error(client, error)


# ==========================================
# WSKAŹNIK PISANIA
# ==========================================

async def handle_typing(
    client: ClientConnection,
    room: RoomState,
    payload: dict,
):
    is_typing = payload.get("isTyping")

    if not isinstance(is_typing, bool):
        return

    async with room.lock:
        if is_typing:
            room.typing_ids.add(client.client_id)
        else:
            room.typing_ids.discard(client.client_id)

    await publish_typing(
        client.room_id,
        room,
    )


# ==========================================
# GŁÓWNY WEBSOCKET
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
        await publish_typing(room_id, room)

        print(f"[JOIN] {nickname} -> {room_id}")

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

            elif event_type == "forward_message":
                await handle_forward_message(
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

            elif event_type == "toggle_reaction":
                await handle_toggle_reaction(
                    client, room, payload
                )

            elif event_type == "typing":
                await handle_typing(
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
        async with room.lock:
            room.connections.discard(client)
            all_connections.discard(client)

            if not is_member_online(
                room,
                client.client_id,
            ):
                room.typing_ids.discard(
                    client.client_id
                )

        await publish_presence(room_id, room)
        await publish_typing(room_id, room)

        print(f"[LEAVE] {nickname} -> {room_id}")
