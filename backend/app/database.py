
import os
from functools import lru_cache
from pathlib import Path
from collections.abc import Iterator

from dotenv import load_dotenv
from sqlalchemy import URL, create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session


# Główny katalog SoCalled
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Wczytanie konfiguracji, jeżeli istnieje plik .env
load_dotenv(PROJECT_ROOT / ".env")


class Base(DeclarativeBase):
    pass


def get_database_url() -> URL:
    password = os.getenv("POSTGRES_PASSWORD")

    if not password:
        raise RuntimeError(
            "Brak POSTGRES_PASSWORD. "
            "Utwórz plik .env w katalogu SoCalled."
        )

    return URL.create(
        drivername="postgresql+psycopg",
        username=os.getenv("POSTGRES_USER", "socalled_user"),
        password=password,
        host="127.0.0.1",
        port=5433,
        database=os.getenv("POSTGRES_DB", "socalled"),
    )


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    return create_engine(
        get_database_url(),
        pool_pre_ping=True,
    )


def get_db() -> Iterator[Session]:
    with Session(get_engine()) as session:
        yield session
