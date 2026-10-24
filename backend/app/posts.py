
"""SoCalled — lokalny feed postów.

Posty zapisujemy w backend/data/posts.json,
a zdjęcia w backend/uploads/posts/.

To prototyp LAN, bez prawdziwego uwierzytelniania.
"""

import asyncio
import json
import os
import re

from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field


router = APIRouter()

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_DIR / "data"
POSTS_FILE = DATA_DIR / "posts.json"
IMAGES_DIR = BACKEND_DIR / "uploads" / "posts"

MAX_POSTS = 500
MAX_IMAGE_SIZE = 8 * 1024 * 1024

IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

EXT_TO_MIME = {
    extension: mime
    for mime, extension in IMAGE_TYPES.items()
}

ID_PATTERN = re.compile(
    r"^[A-Za-z0-9_-]{1,80}$"
)

IMAGE_PATTERN = re.compile(
    r"^[a-f0-9]{32}$"
)

lock = asyncio.Lock()


class CreatePost(BaseModel):
    clientId: str = Field(
        min_length=1,
        max_length=80,
    )
    author: str = Field(
        min_length=1,
        max_length=32,
    )
    text: str = Field(
        default="",
        max_length=2000,
    )
    imageId: str | None = None


class LikePost(BaseModel):
    clientId: str = Field(
        min_length=1,
        max_length=80,
    )


def require_client_id(value: str) -> None:
    if not ID_PATTERN.fullmatch(value):
        raise HTTPException(
            status_code=400,
            detail="Nieprawidłowy identyfikator użytkownika.",
        )


def find_image(image_id: str) -> Path | None:
    if not IMAGE_PATTERN.fullmatch(image_id):
        return None

    for extension in EXT_TO_MIME:
        candidate = (
            IMAGES_DIR / f"{image_id}{extension}"
        )

        if candidate.is_file():
            return candidate

    return None


def read_posts() -> list[dict]:
    if not POSTS_FILE.exists():
        return []

    try:
        data = json.loads(
            POSTS_FILE.read_text(
                encoding="utf-8"
            )
        )
    except (
        OSError,
        json.JSONDecodeError,
    ) as exc:
        raise RuntimeError(
            "Nie można odczytać zapisanych postów SoCalled."
        ) from exc

    if not isinstance(data, list):
        raise RuntimeError(
            "Plik postów ma nieprawidłowy format."
        )

    return data


posts = read_posts()


def save_posts() -> None:
    DATA_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    temp_path = (
        DATA_DIR / f".posts-{uuid4().hex}.tmp"
    )

    try:
        temp_path.write_text(
            json.dumps(
                posts,
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

        os.replace(
            temp_path,
            POSTS_FILE,
        )
    finally:
        temp_path.unlink(
            missing_ok=True
        )


def check_image(
    path: Path,
    mime: str,
) -> bool:
    header = path.read_bytes()[:16]

    if mime == "image/jpeg":
        return header.startswith(
            b"\xff\xd8\xff"
        )

    if mime == "image/png":
        return header.startswith(
            b"\x89PNG\r\n\x1a\n"
        )

    if mime == "image/webp":
        return (
            header.startswith(b"RIFF")
            and header[8:12] == b"WEBP"
        )

    return False


def by_id(
    post_id: str,
) -> dict | None:
    return next(
        (
            item
            for item in posts
            if item["id"] == post_id
        ),
        None,
    )


# ==========================================
# POBIERANIE POSTÓW
# ==========================================

@router.get("/api/posts")
async def get_posts():
    async with lock:
        return {
            "posts": list(reversed(posts))
        }


# ==========================================
# TWORZENIE POSTA
# ==========================================

@router.post(
    "/api/posts",
    status_code=201,
)
async def create_post(
    payload: CreatePost,
):
    require_client_id(
        payload.clientId
    )

    author = payload.author.strip()
    text = payload.text.strip()

    if not author or (
        not text
        and payload.imageId is None
    ):
        raise HTTPException(
            status_code=400,
            detail="Wpisz treść lub wybierz zdjęcie.",
        )

    if (
        payload.imageId is not None
        and find_image(payload.imageId) is None
    ):
        raise HTTPException(
            status_code=400,
            detail="Nie znaleziono zdjęcia.",
        )

    new_post = {
        "id": uuid4().hex,
        "clientId": payload.clientId,
        "author": author,
        "text": text,
        "imageUrl": (
            f"/api/posts/images/{payload.imageId}"
            if payload.imageId
            else None
        ),
        "createdAt": datetime.now(
            timezone.utc
        ).isoformat(),
        "likes": [],
    }

    async with lock:
        posts.append(new_post)

        if len(posts) > MAX_POSTS:
            del posts[:-MAX_POSTS]

        save_posts()

    return {"post": new_post}


# ==========================================
# POLUBIENIA
# ==========================================

@router.post(
    "/api/posts/{post_id}/like"
)
async def toggle_post_like(
    post_id: str,
    payload: LikePost,
):
    require_client_id(
        payload.clientId
    )

    async with lock:
        post = by_id(post_id)

        if post is None:
            raise HTTPException(
                status_code=404,
                detail="Nie znaleziono posta.",
            )

        if payload.clientId in post["likes"]:
            post["likes"].remove(
                payload.clientId
            )
        else:
            post["likes"].append(
                payload.clientId
            )

        save_posts()

        return {"post": dict(post)}


# ==========================================
# USUWANIE WŁASNEGO POSTA
# ==========================================

@router.delete(
    "/api/posts/{post_id}"
)
async def delete_post(
    post_id: str,
    client_id: str,
):
    require_client_id(client_id)

    async with lock:
        post = by_id(post_id)

        if post is None:
            raise HTTPException(
                status_code=404,
                detail="Nie znaleziono posta.",
            )

        if post["clientId"] != client_id:
            raise HTTPException(
                status_code=403,
                detail="Możesz usunąć tylko własny post.",
            )

        posts.remove(post)
        save_posts()

    return {"deleted": True}


# ==========================================
# WYSYŁANIE ZDJĘCIA POSTA
# ==========================================

@router.post(
    "/api/posts/images",
    status_code=201,
)
async def upload_post_image(
    request: Request,
):
    mime = (
        request.headers.get(
            "content-type", ""
        )
        .split(";", 1)[0]
        .strip()
        .lower()
    )

    extension = IMAGE_TYPES.get(mime)

    if extension is None:
        raise HTTPException(
            status_code=415,
            detail="Wyślij zdjęcie JPG, PNG lub WebP.",
        )

    image_id = uuid4().hex

    IMAGES_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    path = (
        IMAGES_DIR /
        f"{image_id}{extension}"
    )

    size = 0

    try:
        with path.open("xb") as output:
            async for chunk in request.stream():
                size += len(chunk)

                if size > MAX_IMAGE_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail="Zdjęcie może mieć maksymalnie 8 MB.",
                    )

                output.write(chunk)

        if (
            size == 0
            or not check_image(path, mime)
        ):
            raise HTTPException(
                status_code=415,
                detail="Nieprawidłowe zdjęcie.",
            )

    except BaseException:
        path.unlink(
            missing_ok=True
        )
        raise

    return {
        "imageId": image_id,
        "url": f"/api/posts/images/{image_id}",
    }


# ==========================================
# ODCZYT ZDJĘCIA POSTA
# ==========================================

@router.get(
    "/api/posts/images/{image_id}"
)
async def get_post_image(
    image_id: str,
):
    path = find_image(image_id)

    if path is None:
        raise HTTPException(
            status_code=404,
            detail="Nie znaleziono zdjęcia.",
        )

    return FileResponse(
        path,
        media_type=EXT_TO_MIME[path.suffix],
        headers={
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, max-age=86400",
        },
    )
