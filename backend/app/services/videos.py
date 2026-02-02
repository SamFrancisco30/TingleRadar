from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models import Video as VideoModel
from app.schemas.video import VideoBase
from app.services.tagging import compute_tags_for_video


def browse_videos(
    db: Session,
    *,
    page: int = 1,
    page_size: int = 50,
    channel_id: Optional[str] = None,
) -> Tuple[List[VideoBase], int]:
    """Simple paginated browse over the videos catalog.

    For now we support:
    - pagination via (page, page_size)
    - optional filtering by channel_id

    The function returns (items, total_count).
    """

    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 50

    query = db.query(VideoModel)
    if channel_id:
        query = query.filter(VideoModel.channel_id == channel_id)

    total = query.count()

    rows = (
        query.order_by(VideoModel.published_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items: List[VideoBase] = []
    for video in rows:
        payload = VideoBase.from_orm(video)
        payload.computed_tags = compute_tags_for_video(video)
        items.append(payload)

    return items, total
