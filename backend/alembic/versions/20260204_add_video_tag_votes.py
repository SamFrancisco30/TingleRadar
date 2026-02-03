"""add video_tag_votes

Revision ID: add_video_tag_votes
Revises: 
Create Date: 2026-02-04 06:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "add_video_tag_votes"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "video_tag_votes",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("video_id", sa.String(length=64), nullable=False),
        sa.Column("tag", sa.String(length=64), nullable=False),
        sa.Column("user_fingerprint", sa.String(length=128), nullable=False),
        sa.Column("vote", sa.SmallInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_video_tag_votes_video_id", "video_tag_votes", ["video_id"])
    op.create_index("ix_video_tag_votes_tag", "video_tag_votes", ["tag"])
    op.create_unique_constraint(
        "uq_video_tag_user",
        "video_tag_votes",
        ["video_id", "tag", "user_fingerprint"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_video_tag_user", "video_tag_votes", type_="unique")
    op.drop_index("ix_video_tag_votes_video_id", table_name="video_tag_votes")
    op.drop_index("ix_video_tag_votes_tag", table_name="video_tag_votes")
    op.drop_table("video_tag_votes")
