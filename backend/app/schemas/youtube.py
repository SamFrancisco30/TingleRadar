from typing import List, Optional

from pydantic import BaseModel, Field


class PlaylistSyncPayload(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = ""
    video_ids: List[str] = Field(..., min_items=1)


class PlaylistSyncResponse(BaseModel):
    playlist_id: str
    playlist_url: str


class YouTubeStatusResponse(BaseModel):
    authorized: bool
    playlist_id: Optional[str]
