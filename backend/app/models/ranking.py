from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class RankingList(Base):
    __tablename__ = "ranking_lists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ranking_items = relationship("RankingItem", back_populates="ranking_list")


class RankingItem(Base):
    __tablename__ = "ranking_items"

    id = Column(Integer, primary_key=True, index=True)
    ranking_list_id = Column(Integer, ForeignKey("ranking_lists.id"), nullable=False)
    video_id = Column(String(64), ForeignKey("videos.youtube_id"), nullable=False)
    position = Column(Integer, nullable=False)
    score = Column(Integer, nullable=True)

    ranking_list = relationship("RankingList", back_populates="ranking_items")


class UserTag(Base):
    __tablename__ = "user_tags"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(String(64), ForeignKey("videos.youtube_id"), nullable=False)
    tag = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    source = Column(String(64), nullable=True)
