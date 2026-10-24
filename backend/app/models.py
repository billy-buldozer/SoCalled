
from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
    false,
    true,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database import Base


# ==========================================
# USERS — UŻYTKOWNICY
# ==========================================

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    username: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(254),
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=true(),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    owned_rooms: Mapped[list[Room]] = relationship(
        back_populates="owner",
    )

    memberships: Mapped[list[RoomMember]] = relationship(
        back_populates="user",
    )

    messages: Mapped[list[Message]] = relationship(
        back_populates="author",
    )

    __table_args__ = (
        Index("ix_users_username", "username", unique=True),
        Index("ix_users_email", "email", unique=True),
    )


# ==========================================
# ROOMS — POKOJE
# ==========================================

class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    topic: Mapped[str | None] = mapped_column(
        String(160),
        nullable=True,
    )

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    is_private: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=false(),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    owner: Mapped[User] = relationship(
        back_populates="owned_rooms",
    )

    memberships: Mapped[list[RoomMember]] = relationship(
        back_populates="room",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    messages: Mapped[list[Message]] = relationship(
        back_populates="room",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        Index("ix_rooms_owner_id", "owner_id"),
    )


# ==========================================
# ROOM MEMBERS — CZŁONKOSTWO W POKOJACH
# ==========================================

class RoomMember(Base):
    __tablename__ = "room_members"

    room_id: Mapped[int] = mapped_column(
        ForeignKey("rooms.id", ondelete="CASCADE"),
        primary_key=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    role: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        server_default="member",
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    room: Mapped[Room] = relationship(
        back_populates="memberships",
    )

    user: Mapped[User] = relationship(
        back_populates="memberships",
    )

    __table_args__ = (
        CheckConstraint(
            "role IN ('owner', 'moderator', 'member')",
            name="ck_room_members_role",
        ),
        Index("ix_room_members_user_id", "user_id"),
    )


# ==========================================
# MESSAGES — WIADOMOŚCI
# ==========================================

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    room_id: Mapped[int] = mapped_column(
        ForeignKey("rooms.id", ondelete="CASCADE"),
        nullable=False,
    )

    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        String(2000),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    room: Mapped[Room] = relationship(
        back_populates="messages",
    )

    author: Mapped[User] = relationship(
        back_populates="messages",
    )

    __table_args__ = (
        CheckConstraint(
            "length(trim(content)) > 0",
            name="ck_messages_nonempty_content",
        ),
        Index(
            "ix_messages_room_created_id",
            "room_id",
            "created_at",
            "id",
        ),
        Index("ix_messages_author_id", "author_id"),
    )
