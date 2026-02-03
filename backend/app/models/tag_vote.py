from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, SmallInteger, String, UniqueConstraint

from app.db.base import Base


class VideoTagVote(Base):
    __tablename__ = "video_tag_votes"
    __table_args__ = (
        UniqueConstraint("video_id", "tag", "user_fingerprint", name="uq_video_tag_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(String(64), nullable=False, index=True)
    tag = Column(String(64), nullable=False, index=True)
    user_fingerprint = Column(String(128), nullable=False)
    vote = Column(SmallInteger, nullable=False)  # +1 or -1
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
