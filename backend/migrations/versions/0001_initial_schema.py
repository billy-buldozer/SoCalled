
from alembic import op
import sqlalchemy as sa


revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # =====================================
    # USERS
    # =====================================

    op.create_table(
        "users",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
        ),
        sa.Column(
            "username",
            sa.String(32),
            nullable=False,
        ),
        sa.Column(
            "email",
            sa.String(254),
            nullable=False,
        ),
        sa.Column(
            "password_hash",
            sa.String(255),
            nullable=False,
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_users_username",
        "users",
        ["username"],
        unique=True,
    )

    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=True,
    )

    # =====================================
    # ROOMS
    # =====================================

    op.create_table(
        "rooms",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
        ),
        sa.Column(
            "name",
            sa.String(80),
            nullable=False,
        ),
        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "topic",
            sa.String(160),
            nullable=True,
        ),
        sa.Column(
            "owner_id",
            sa.Integer(),
            sa.ForeignKey(
                "users.id",
                ondelete="RESTRICT",
            ),
            nullable=False,
        ),
        sa.Column(
            "is_private",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_rooms_owner_id",
        "rooms",
        ["owner_id"],
    )

    # =====================================
    # ROOM MEMBERS
    # =====================================

    op.create_table(
        "room_members",
        sa.Column(
            "room_id",
            sa.Integer(),
            sa.ForeignKey(
                "rooms.id",
                ondelete="CASCADE",
            ),
            primary_key=True,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey(
                "users.id",
                ondelete="CASCADE",
            ),
            primary_key=True,
        ),
        sa.Column(
            "role",
            sa.String(16),
            nullable=False,
            server_default="member",
        ),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint(
            "role IN ('owner', 'moderator', 'member')",
            name="ck_room_members_role",
        ),
    )

    op.create_index(
        "ix_room_members_user_id",
        "room_members",
        ["user_id"],
    )

    # =====================================
    # MESSAGES
    # =====================================

    op.create_table(
        "messages",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
        ),
        sa.Column(
            "room_id",
            sa.Integer(),
            sa.ForeignKey(
                "rooms.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column(
            "author_id",
            sa.Integer(),
            sa.ForeignKey(
                "users.id",
                ondelete="RESTRICT",
            ),
            nullable=False,
        ),
        sa.Column(
            "content",
            sa.String(2000),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint(
            "length(trim(content)) > 0",
            name="ck_messages_nonempty_content",
        ),
    )

    op.create_index(
        "ix_messages_room_created_id",
        "messages",
        ["room_id", "created_at", "id"],
    )

    op.create_index(
        "ix_messages_author_id",
        "messages",
        ["author_id"],
    )


def downgrade() -> None:
    # Usuwanie tabel w odwrotnej kolejności

    op.drop_index(
        "ix_messages_author_id",
        table_name="messages",
    )
    op.drop_index(
        "ix_messages_room_created_id",
        table_name="messages",
    )
    op.drop_table("messages")

    op.drop_index(
        "ix_room_members_user_id",
        table_name="room_members",
    )
    op.drop_table("room_members")

    op.drop_index(
        "ix_rooms_owner_id",
        table_name="rooms",
    )
    op.drop_table("rooms")

    op.drop_index(
        "ix_users_email",
        table_name="users",
    )
    op.drop_index(
        "ix_users_username",
        table_name="users",
    )
    op.drop_table("users")
