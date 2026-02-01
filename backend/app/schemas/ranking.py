from __future__ import annotations

from typing import List

from pydantic import BaseModel

from app.schemas.video import VideoBase


class RankingItem(BaseModel):
    rank: int
    video: VideoBase
    score: int


class RankingList(BaseModel):
    name: str
    description: str
    published_at: str
    items: List[RankingItem]
