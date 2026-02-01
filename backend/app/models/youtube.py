from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.db.base import Base


class YouTubeCredential(Base):
    __tablename__ = "youtube_credentials"

    id = Column(Integer, primary_key=True, index=True)
    refresh_token = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class YouTubePlaylist(Base):
    __tablename__ = "youtube_playlists"

    id = Column(Integer, primary_key=True, index=True)
    playlist_id = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
