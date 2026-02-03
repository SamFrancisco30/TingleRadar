from collections import defaultdict
from typing import Dict

from sqlalchemy.orm import Session

from app.models import VideoTagVote


def record_tag_vote(
    db: Session,
    *,
    video_id: str,
    tag: str,
    user_fingerprint: str,
    vote: int,
) -> int:
    """Insert or update a vote for a given (video, tag, user).

    Returns the aggregated score for this (video, tag) after the update.
    """
    vote_value = 1 if vote > 0 else -1

    existing = (
        db.query(VideoTagVote)
        .filter(
            VideoTagVote.video_id == video_id,
            VideoTagVote.tag == tag,
            VideoTagVote.user_fingerprint == user_fingerprint,
        )
        .first()
    )
    if existing:
        existing.vote = vote_value
    else:
        db.add(
            VideoTagVote(
                video_id=video_id,
                tag=tag,
                user_fingerprint=user_fingerprint,
                vote=vote_value,
            )
        )
    db.commit()

    # Recompute aggregate score for this (video, tag)
    total = (
        db.query(VideoTagVote)
        .filter(VideoTagVote.video_id == video_id, VideoTagVote.tag == tag)
        .with_entities(VideoTagVote.vote)
        .all()
    )
    return sum(v[0] for v in total)


def get_tag_vote_scores(db: Session, video_id: str) -> Dict[str, int]:
    """Return {tag: score} for all tags that have votes on this video."""
    rows = (
        db.query(VideoTagVote.tag, VideoTagVote.vote)
        .filter(VideoTagVote.video_id == video_id)
        .all()
    )
    scores: Dict[str, int] = defaultdict(int)
    for tag, vote in rows:
        scores[tag] += vote
    return dict(scores)
