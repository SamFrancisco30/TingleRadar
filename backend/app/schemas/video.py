from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field


class VideoBase(BaseModel):
    youtube_id: str
    title: str
    description: Optional[str]
    channel_title: str
    channel_id: str
    published_at: datetime
    view_count: int
    like_count: int
    duration: Optional[int]
    tags: Optional[List[str]] = Field(default_factory=list)
    thumbnail_url: Optional[str]

    class Config:
        orm_mode = True


class VideoDetail(VideoBase):
    additional_metadata: Optional[dict[str, Any]] = None
