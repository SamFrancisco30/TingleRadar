from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.db.base import Base


class CreatorWatchlist(Base):
    """YouTube channels to actively ingest videos from.

    This is the seed list for the channel-based data pipeline that backfills
    and maintains a richer `videos` catalog beyond ranking snapshots.
    """

    __tablename__ = "creator_watchlist"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(String(64), unique=True, nullable=False, index=True)
    channel_title = Column(String(256), nullable=False)
    # Optional human-readable handle or note (e.g. language, niche).
    note = Column(Text, nullable=True)
    # Simple priority knob so we can crawl high-priority creators more often.
    priority = Column(Integer, nullable=False, default=1)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<CreatorWatchlist channel_id={self.channel_id} title={self.channel_title!r}>"
