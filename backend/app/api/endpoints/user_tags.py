from typing import Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models import Video as VideoModel
from app.services.tag_catalog import ALLOWED_TAGS
from app.services.tag_feedback import add_user_tag

router = APIRouter(prefix="/videos", tags=["user-tags"])


class UserTagPayload(BaseModel):
    tag: str


@router.post("/{video_id}/tags", response_model=Dict[str, bool])
def create_user_tag(
    video_id: str,
    payload: UserTagPayload,
    db: Session = Depends(get_db),
):
    if payload.tag not in ALLOWED_TAGS:
        raise HTTPException(status_code=400, detail="Unknown or unsupported tag id")

    video = db.query(VideoModel).filter(VideoModel.youtube_id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    created = add_user_tag(db, video_id=video_id, tag=payload.tag)
    return {"created": created}
