"""add creator_watchlist table

Revision ID: 9f01b3a3d9a1
Revises: 8f715e99d281
Create Date: 2026-02-02 12:26:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision = "9f01b3a3d9a1"
down_revision = "8f715e99d281"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "creator_watchlist",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("channel_id", sa.String(length=64), nullable=False),
        sa.Column("channel_title", sa.String(length=256), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=func.now()),
    )
    op.create_index(
        op.f("ix_creator_watchlist_id"), "creator_watchlist", ["id"], unique=False
    )
    op.create_index(
        op.f("ux_creator_watchlist_channel_id"),
        "creator_watchlist",
        ["channel_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ux_creator_watchlist_channel_id"), table_name="creator_watchlist")
    op.drop_index(op.f("ix_creator_watchlist_id"), table_name="creator_watchlist")
    op.drop_table("creator_watchlist")
