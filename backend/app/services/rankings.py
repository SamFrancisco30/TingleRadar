from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models import RankingList as RankingListModel
from app.models import RankingItem as RankingItemModel
from app.models import Video as VideoModel
from app.schemas.ranking import RankingItem, RankingList
from app.schemas.video import VideoBase
from app.services.tagging import compute_tags_for_video


def fetch_ranking_by_id(db: Session, ranking_id: int) -> Optional[RankingList]:
    ranking = db.query(RankingListModel).filter(RankingListModel.id == ranking_id).first()
    if not ranking:
        return None
    return _build_ranking_payload(db, ranking)


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
        video_payload.computed_tags = compute_tags_for_video(video)

        ranking_items.append(
            RankingItem(
                rank=item.position,
                score=item.score or 0,
                video=video_payload,
            )
        )
    return RankingList(
        id=ranking.id,
        name=ranking.name,
        description=ranking.description or "",
        published_at=ranking.created_at.isoformat(),
        items=ranking_items,
    )


def fetch_weekly_rankings(db: Session) -> List[RankingList]:
    query = (
        db.query(RankingListModel)
        .order_by(RankingListModel.created_at.desc())
        .limit(3)
        .all()
    )

    results: List[RankingList] = []
    for ranking in query:
        results.append(_build_ranking_payload(db, ranking))
    return results
