"""Create initial ASMR tables

Revision ID: 0001_initial
Revises: 
Create Date: 2025-12-xx
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "videos",
        sa.Column("youtube_id", sa.String(length=64), primary_key=True, nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("channel_title", sa.String(length=256), nullable=False),
        sa.Column("channel_id", sa.String(length=64), nullable=False),
        sa.Column("published_at", sa.DateTime(), nullable=False),
        sa.Column("view_count", sa.Integer(), nullable=False),
        sa.Column("like_count", sa.Integer(), nullable=False),
        sa.Column("duration", sa.Integer(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("thumbnail_url", sa.String(length=1024), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )

    op.create_table(
        "ranking_lists",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "ranking_items",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("ranking_list_id", sa.Integer(), sa.ForeignKey("ranking_lists.id"), nullable=False),
        sa.Column("video_id", sa.String(length=64), sa.ForeignKey("videos.youtube_id"), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=True),
    )

    op.create_table(
        "user_tags",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("video_id", sa.String(length=64), sa.ForeignKey("videos.youtube_id"), nullable=False),
        sa.Column("tag", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("source", sa.String(length=64), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("user_tags")
    op.drop_table("ranking_items")
    op.drop_table("ranking_lists")
    op.drop_table("videos")
