from collections import defaultdict
from typing import Iterable

from sqlalchemy.orm import Session

from app.models import UserTag


def build_effective_tags(
    *,
    auto_tags: Iterable[str],
    vote_scores: dict[str, int],
    user_tags: Iterable[str],
) -> list[str]:
    effective_tags = set(auto_tags)
    effective_tags.update(user_tags)

    for tag, score in vote_scores.items():
        if score <= -3:
            effective_tags.discard(tag)
        elif score >= 3:
            effective_tags.add(tag)

    return sorted(effective_tags)


def get_user_tags_map(db: Session, video_ids: Iterable[str]) -> dict[str, list[str]]:
    ids = list(dict.fromkeys(video_ids))
    if not ids:
        return {}

    rows = (
        db.query(UserTag.video_id, UserTag.tag)
        .filter(UserTag.video_id.in_(ids))
        .all()
    )
    tag_map: dict[str, set[str]] = defaultdict(set)
    for video_id, tag in rows:
        tag_map[video_id].add(tag)
    return {video_id: sorted(tags) for video_id, tags in tag_map.items()}


def add_user_tag(
    db: Session,
    *,
    video_id: str,
    tag: str,
    source: str = "user",
) -> bool:
    existing = (
        db.query(UserTag)
        .filter(UserTag.video_id == video_id, UserTag.tag == tag)
        .first()
    )
    if existing:
        return False

    db.add(UserTag(video_id=video_id, tag=tag, source=source))
    db.commit()
    return True
