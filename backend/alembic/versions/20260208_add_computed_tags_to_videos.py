"""add computed_tags column to videos

Revision ID: 20260208_add_computed_tags_to_videos
Revises: add_video_tag_votes
Create Date: 2026-02-08 10:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260208_add_computed_tags_to_videos"
down_revision: Union[str, None] = "add_video_tag_votes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("videos", sa.Column("computed_tags", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("videos", "computed_tags")
