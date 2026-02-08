from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    JSON,
    String,
    Text,
)

from app.db.base import Base


class Video(Base):
    __tablename__ = "videos"

    youtube_id = Column(String(64), primary_key=True, index=True)
    title = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    channel_title = Column(String(256), nullable=False)
    channel_id = Column(String(64), nullable=False)
    published_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    like_count = Column(Integer, default=0, nullable=False)
    duration = Column(Integer, nullable=True)
    tags = Column(JSON, nullable=True)
    computed_tags = Column(JSON, nullable=True)
    thumbnail_url = Column(String(1024), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
