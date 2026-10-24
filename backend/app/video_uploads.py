
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse


router = APIRouter()

MAX_VIDEO_SIZE = 40 * 1024 * 1024
CHUNK_SIZE = 1024 * 1024

VIDEO_DIRECTORY = (
    Path(__file__).resolve().parent.parent
    / "uploads"
    / "videos"
)

ALLOWED_VIDEO_TYPES = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
}

EXTENSION_TO_TYPE = {
    extension: mime_type
    for mime_type, extension in ALLOWED_VIDEO_TYPES.items()
}


def video_path(video_id: str) -> Path | None:
    if len(video_id) != 32:
        return None

    if any(character not in "0123456789abcdef"
           for character in video_id):
        return None

    for extension in EXTENSION_TO_TYPE:
        path = VIDEO_DIRECTORY / f"{video_id}{extension}"

        if path.is_file():
            return path

    return None


def video_exists(video_id: str) -> bool:
    if not isinstance(video_id, str):
        return False

    return video_path(video_id) is not None


def valid_video_signature(
    path: Path,
    mime_type: str,
) -> bool:
    with path.open("rb") as file:
        header = file.read(16)

    if mime_type == "video/webm":
        return header.startswith(b"\x1a\x45\xdf\xa3")

    if mime_type in ("video/mp4", "video/quicktime"):
        return len(header) >= 12 and header[4:8] == b"ftyp"

    return False


@router.post("/api/videos", status_code=201)
async def upload_video(request: Request):
    mime_type = (
        request.headers.get("content-type", "")
        .split(";", 1)[0]
        .strip()
        .lower()
    )

    extension = ALLOWED_VIDEO_TYPES.get(mime_type)

    if extension is None:
        raise HTTPException(
            status_code=415,
            detail="Obsługiwane są filmy MP4, WebM i MOV.",
        )

    content_length = request.headers.get("content-length")

    if content_length:
        try:
            declared_size = int(content_length)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Nieprawidłowa wielkość pliku.",
            )

        if declared_size > MAX_VIDEO_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Film może mieć maksymalnie 40 MB.",
            )

    VIDEO_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    video_id = uuid4().hex
    path = VIDEO_DIRECTORY / f"{video_id}{extension}"

    received = 0

    try:
        with path.open("xb") as output:
            async for chunk in request.stream():
                received += len(chunk)

                if received > MAX_VIDEO_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail="Film może mieć maksymalnie 40 MB.",
                    )

                output.write(chunk)

        if received == 0:
            raise HTTPException(
                status_code=400,
                detail="Przesłany plik jest pusty.",
            )

        if not valid_video_signature(path, mime_type):
            raise HTTPException(
                status_code=415,
                detail="Nieprawidłowy format pliku wideo.",
            )

    except BaseException:
        path.unlink(missing_ok=True)
        raise

    return {
        "id": video_id,
        "url": f"/api/videos/{video_id}",
        "size": received,
        "mimeType": mime_type,
    }


@router.get("/api/videos/{video_id}")
async def get_video(video_id: str):
    path = video_path(video_id)

    if path is None:
        raise HTTPException(
            status_code=404,
            detail="Nie znaleziono filmu.",
        )

    mime_type = EXTENSION_TO_TYPE[path.suffix]

    return FileResponse(
        path=path,
        media_type=mime_type,
        content_disposition_type="inline",
        headers={
            "Cache-Control": "private, max-age=3600",
            "X-Content-Type-Options": "nosniff",
        },
    )
