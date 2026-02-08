from datetime import datetime
import re
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models import RankingList as RankingListModel
from app.models import RankingItem as RankingItemModel
from app.models import Video as VideoModel
from app.schemas.ranking import RankingItem, RankingList
from app.schemas.video import VideoBase
from app.services.tagging import compute_tags_for_video
from app.services.tag_votes import get_tag_vote_scores


def fetch_ranking_by_id(db: Session, ranking_id: int) -> Optional[RankingList]:
    ranking = db.query(RankingListModel).filter(RankingListModel.id == ranking_id).first()
    if not ranking:
        return None
    return _build_ranking_payload(db, ranking)


def _extract_label_date(name: str, created_at: datetime) -> datetime:
    """Use the YYYY-MM-DD suffix in the ranking name when present.

    This keeps the weekly label stable even for backfilled lists that were
    created later in time.
    """
    match = re.search(r"(\d{4}-\d{2}-\d{2})$", name)
    if not match:
        return created_at
    try:
        return datetime.strptime(match.group(1), "%Y-%m-%d")
    except ValueError:
        return created_at


def _build_ranking_payload(db: Session, ranking: RankingListModel) -> RankingList:
    items_query = (
        db.query(RankingItemModel)
        .filter(RankingItemModel.ranking_list_id == ranking.id)
        .order_by(RankingItemModel.position)
        .all()
    )
    ranking_items = []
    for item in items_query:
        video = db.query(VideoModel).filter(VideoModel.youtube_id == item.video_id).first()
        if not video:
            continue

        video_payload = VideoBase.from_orm(video)
        # Attach computed tags so the frontend can filter by trigger/roleplay/etc.
        # Prefer persisted computed_tags when available; otherwise compute once
        # and persist back to the Video row so subsequent requests reuse it.
        if video.computed_tags:
            auto_tags = list(video.computed_tags)
        else:
            auto_tags = compute_tags_for_video(video)
            video.computed_tags = auto_tags
            db.add(video)

        vote_scores = get_tag_vote_scores(db, video.youtube_id)

        # Apply simple vote-based adjustments: heavily downvoted auto tags are
        # suppressed; heavily upvoted non-auto tags are added.
        effective_tags = set(auto_tags)
        for tag, score in vote_scores.items():
            if tag in effective_tags and score <= -3:
                effective_tags.remove(tag)
            elif tag not in effective_tags and score >= 3:
                effective_tags.add(tag)

        video_payload.computed_tags = list(effective_tags)

        ranking_items.append(
            RankingItem(
                rank=item.position,
                score=item.score or 0,
                video=video_payload,
            )
        )

    label_date = _extract_label_date(ranking.name, ranking.created_at)

    return RankingList(
        id=ranking.id,
        name=ranking.name,
        description=ranking.description or "",
        published_at=label_date.isoformat(),
        items=ranking_items,
    )


def fetch_weekly_rankings(db: Session) -> List[RankingList]:
    """Return the most recent weekly ranking list only.

    The API contract for /rankings/weekly still returns a list for
    backwards-compatibility, but the payload contains just the latest
    ranking. Older weeks remain in the database for historical analysis
    and offline tooling.
    """
    latest = (
        db.query(RankingListModel)
        .order_by(RankingListModel.created_at.desc())
        .first()
    )

    if not latest:
        return []

    return [_build_ranking_payload(db, latest)]
