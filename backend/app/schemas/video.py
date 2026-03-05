from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, validator


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
    # Computed tags derived from title/description/tags on the backend.
    computed_tags: List[str] = Field(default_factory=list)

    @validator("tags", "computed_tags", pre=True, always=True)
    def default_empty_list(cls, value):
        if value is None:
            return []
        return value

    class Config:
        orm_mode = True


class VideoDetail(VideoBase):
    additional_metadata: Optional[Dict[str, Any]] = None


