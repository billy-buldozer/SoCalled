
import asyncio
import os
import shutil

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse


router = APIRouter()

MAX_VIDEO_SIZE = 40 * 1024 * 1024

VIDEO_DIRECTORY = (
    Path(__file__).resolve().parent.parent
    / "uploads"
    / "videos"
)

CONVERTED_DIRECTORY = (
    VIDEO_DIRECTORY / "mp4_cache"
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

# Oddzielna blokada dla każdego filmu.
# Zapobiega wielokrotnej konwersji tego
# samego nagrania w jednym procesie.
conversion_locks: dict[str, asyncio.Lock] = {}

# Ograniczamy liczbę równoczesnych konwersji.
conversion_slots = asyncio.Semaphore(2)


# ==========================================
# ODSZUKIWANIE FILMU
# ==========================================

def video_path(video_id: str) -> Path | None:
    if not isinstance(video_id, str):
        return None

    if len(video_id) != 32:
        return None

    if any(
        character not in "0123456789abcdef"
        for character in video_id
    ):
        return None

    for extension in EXTENSION_TO_TYPE:
        path = VIDEO_DIRECTORY / f"{video_id}{extension}"

        if path.is_file():
            return path

    return None


def video_exists(video_id: str) -> bool:
    return video_path(video_id) is not None


# ==========================================
# SPRAWDZANIE FORMATU
# ==========================================

def valid_video_signature(
    path: Path,
    mime_type: str,
) -> bool:
    with path.open("rb") as file:
        header = file.read(16)

    if mime_type == "video/webm":
        return header.startswith(
            b"\x1a\x45\xdf\xa3"
        )

    if mime_type in (
        "video/mp4",
        "video/quicktime",
    ):
        return (
            len(header) >= 12
            and header[4:8] == b"ftyp"
        )

    return False


# ==========================================
# WYSYŁANIE FILMU
# ==========================================

@router.post("/api/videos", status_code=201)
async def upload_video(request: Request):
    mime_type = (
        request.headers.get("content-type", "")
        .split(";", 1)[0]
        .strip()
        .lower()
    )

    extension = ALLOWED_VIDEO_TYPES.get(
        mime_type
    )

    if extension is None:
        raise HTTPException(
            status_code=415,
            detail=(
                "Obsługiwane są filmy "
                "MP4, WebM i MOV."
            ),
        )

    content_length = request.headers.get(
        "content-length"
    )

    if content_length is not None:
        try:
            declared_size = int(content_length)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Nieprawidłowa wielkość pliku.",
            )

        if declared_size < 0:
            raise HTTPException(
                status_code=400,
                detail="Nieprawidłowa wielkość pliku.",
            )

        if declared_size > MAX_VIDEO_SIZE:
            raise HTTPException(
                status_code=413,
                detail=(
                    "Film może mieć maksymalnie 40 MB."
                ),
            )

    VIDEO_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    video_id = uuid4().hex
    path = (
        VIDEO_DIRECTORY /
        f"{video_id}{extension}"
    )

    received = 0

    try:
        with path.open("xb") as output:
            async for chunk in request.stream():
                received += len(chunk)

                if received > MAX_VIDEO_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail=(
                            "Film może mieć maksymalnie 40 MB."
                        ),
                    )

                output.write(chunk)

        if received == 0:
            raise HTTPException(
                status_code=400,
                detail="Przesłany plik jest pusty.",
            )

        if not valid_video_signature(
            path,
            mime_type,
        ):
            raise HTTPException(
                status_code=415,
                detail="Nieprawidłowy format filmu.",
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


# ==========================================
# ODTWARZANIE FILMU
# ==========================================

@router.get("/api/videos/{video_id}")
async def get_video(video_id: str):
    path = video_path(video_id)

    if path is None:
        raise HTTPException(
            status_code=404,
            detail="Nie znaleziono filmu.",
        )

    mime_type = EXTENSION_TO_TYPE[
        path.suffix
    ]

    return FileResponse(
        path=path,
        media_type=mime_type,
        content_disposition_type="inline",
        headers={
            "Cache-Control": "private, max-age=3600",
            "X-Content-Type-Options": "nosniff",
        },
    )


# ==========================================
# KONWERSJA WEBM / MOV DO MP4
# ==========================================

async def convert_to_mp4(
    video_id: str,
    source: Path,
) -> Path:
    CONVERTED_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    destination = (
        CONVERTED_DIRECTORY /
        f"{video_id}.mp4"
    )

    # Jeśli wcześniej wykonaliśmy konwersję,
    # wykorzystujemy istniejący plik.
    if (
        destination.is_file()
        and destination.stat().st_size > 0
    ):
        return destination

    lock = conversion_locks.setdefault(
        video_id,
        asyncio.Lock(),
    )

    async with lock:
        # Ponownie sprawdzamy cache po
        # uzyskaniu blokady.
        if (
            destination.is_file()
            and destination.stat().st_size > 0
        ):
            return destination

        ffmpeg = shutil.which("ffmpeg")

        if ffmpeg is None:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Konwersja do MP4 wymaga FFmpeg "
                    "na komputerze z backendem."
                ),
            )

        temporary = (
            CONVERTED_DIRECTORY /
            f".{video_id}-{uuid4().hex}.mp4"
        )

        try:
            async with conversion_slots:
                process = await asyncio.create_subprocess_exec(
                    ffmpeg,

                    "-hide_banner",
                    "-loglevel", "error",
                    "-nostdin",
                    "-y",

                    "-i", str(source),

                    # Pierwszy strumień wideo.
                    "-map", "0:v:0",

                    # Dźwięk, jeżeli istnieje.
                    "-map", "0:a:0?",

                    # MP4 z kodekiem H.264.
                    "-c:v", "libx264",
                    "-preset", "veryfast",
                    "-crf", "24",
                    "-pix_fmt", "yuv420p",

                    # Parzyste wymiary obrazu.
                    "-vf",
                    "scale=ceil(iw/2)*2:ceil(ih/2)*2",

                    # Dźwięk AAC.
                    "-c:a", "aac",
                    "-b:a", "128k",

                    # Przydatne przy odtwarzaniu online.
                    "-movflags", "+faststart",

                    "-f", "mp4",
                    str(temporary),

                    stdout=asyncio.subprocess.DEVNULL,
                    stderr=asyncio.subprocess.PIPE,
                )

                try:
                    _, error_output = await asyncio.wait_for(
                        process.communicate(),
                        timeout=300,
                    )
                except BaseException:
                    if process.returncode is None:
                        process.kill()
                        await process.wait()
                    raise

            if process.returncode != 0:
                error_text = error_output.decode(
                    "utf-8",
                    errors="replace",
                )

                print(
                    "[SoCalled] Błąd FFmpeg:",
                    error_text[-1500:],
                )

                raise HTTPException(
                    status_code=422,
                    detail=(
                        "Nie udało się przekonwertować "
                        "tego filmu do MP4."
                    ),
                )

            if (
                not temporary.is_file()
                or temporary.stat().st_size == 0
            ):
                raise HTTPException(
                    status_code=500,
                    detail=(
                        "FFmpeg nie utworzył pliku MP4."
                    ),
                )

            # Gotowy plik udostępniamy dopiero
            # po zakończeniu konwersji.
            os.replace(
                temporary,
                destination,
            )

            return destination

        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=504,
                detail=(
                    "Przekroczono limit czasu "
                    "konwersji filmu."
                ),
            )

        finally:
            temporary.unlink(
                missing_ok=True
            )


# ==========================================
# NOWOŚĆ — POBIERANIE FILMU JAKO MP4
# ==========================================

@router.get("/api/videos/{video_id}/download")
async def download_video(video_id: str):
    source = video_path(video_id)

    if source is None:
        raise HTTPException(
            status_code=404,
            detail="Nie znaleziono filmu.",
        )

    if source.suffix == ".mp4":
        # Już jest MP4, więc nie tracimy
        # jakości przez ponowną konwersję.
        downloadable = source
    else:
        # WebM lub MOV konwertujemy do MP4.
        downloadable = await convert_to_mp4(
            video_id,
            source,
        )

    return FileResponse(
        path=downloadable,
        media_type="video/mp4",
        filename=(
            f"socalled-{video_id[:8]}.mp4"
        ),
        content_disposition_type="attachment",
        headers={
            "Cache-Control": "private, max-age=3600",
            "X-Content-Type-Options": "nosniff",
        },
    )
