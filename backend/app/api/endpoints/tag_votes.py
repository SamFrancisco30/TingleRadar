from typing import Dict

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.services.tag_votes import record_tag_vote

router = APIRouter(prefix="/videos", tags=["tag-votes"])


class TagVotePayload(BaseModel):
  vote: int  # +1 or -1


ALLOWED_TAGS = {
    "tapping",
    "scratching",
    "crinkling",
    "brushing",
    "ear_cleaning",
    "mouth_sounds",
    "white_noise",
    "binaural",
    "visual_asmr",
    "layered",
    "roleplay",
    "whisper",
    "soft_spoken",
    "no_talking",
    "rp_haircut",
    "rp_cranial",
    "rp_dentist",
    # Language codes are also allowed so users can downvote language classification.
    "en",
    "ja",
    "ko",
    "zh",
}


@router.post("/{video_id}/tags/{tag}/vote", response_model=Dict[str, int])
def vote_on_tag(
    video_id: str,
    tag: str,
    payload: TagVotePayload,
    db: Session = Depends(get_db),
    x_user_fingerprint: str | None = Header(default=None, convert_underscores=False),
):
    """Record a +1/-1 vote for a tag on a given video.

    The client should send a stable anonymous fingerprint via the
    `X-User-Fingerprint` header so we can enforce one vote per
    (video, tag, user).
    """

    if tag not in ALLOWED_TAGS:
        raise HTTPException(status_code=400, detail="Unknown or unsupported tag id")

    if payload.vote not in (-1, 1):
        raise HTTPException(status_code=400, detail="vote must be +1 or -1")

    fingerprint = x_user_fingerprint or "anonymous"

    score = record_tag_vote(
        db,
        video_id=video_id,
        tag=tag,
        user_fingerprint=fingerprint,
        vote=payload.vote,
    )

    return {"score": score}
