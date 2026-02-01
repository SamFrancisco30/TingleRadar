from datetime import datetime
from typing import List

from sqlalchemy.orm import Session

from app.models import RankingList as RankingListModel
from app.models import RankingItem as RankingItemModel
from app.models import Video as VideoModel
from app.schemas.ranking import RankingItem, RankingList
from app.schemas.video import VideoBase


def fetch_weekly_rankings(db: Session) -> List[RankingList]:
    query = (
        db.query(RankingListModel)
        .order_by(RankingListModel.created_at.desc())
        .limit(3)
        .all()
    )

    results: List[RankingList] = []
    for ranking in query:
        items_query = (
            db.query(RankingItemModel)
            .filter(RankingItemModel.ranking_list_id == ranking.id)
            .order_by(RankingItemModel.position)
            .limit(10)
            .all()
        )
        ranking_items = []
        for item in items_query:
            video = db.query(VideoModel).filter(VideoModel.youtube_id == item.video_id).first()
            if not video:
                continue
            ranking_items.append(
                RankingItem(
                    rank=item.position,
                    score=item.score or 0,
                    video=VideoBase.from_orm(video),
                )
            )
        results.append(
            RankingList(
                name=ranking.name,
                description=ranking.description or "",
                published_at=ranking.created_at.isoformat(),
                items=ranking_items,
            )
        )
    return results
