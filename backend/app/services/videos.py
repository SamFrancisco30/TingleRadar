from typing import List, Optional, Sequence, Tuple

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
    channel_ids: Optional[Sequence[str]] = None,
    duration_bucket: Optional[str] = None,
    tags: Optional[Sequence[str]] = None,
) -> Tuple[List[VideoBase], int]:
    """Simple paginated browse over the videos catalog.

    Supports:
    - pagination via (page, page_size)
    - optional filtering by channel_id
    - optional duration_bucket: "short" (2-5 min), "medium" (5-15 min), "long" (>=15 min)
    - optional tags: list of internal computed tag ids (e.g. ["tapping", "no_talking"]).

    For now tag filtering is applied in Python after computing computed_tags,
    which is acceptable for modest result sizes. We can move this into SQL later
    by persisting computed_tags on the Video model.
    """

    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 50

    query = db.query(VideoModel)
    # Backwards-compatible single-channel filter.
    if channel_id:
        query = query.filter(VideoModel.channel_id == channel_id)
    # Multi-channel OR filter takes precedence when provided.
    if channel_ids:
        query = query.filter(VideoModel.channel_id.in_(list(channel_ids)))

    # Duration bucket is handled at the SQL level so pagination reflects the filtered
    # subset as much as possible.
    min_seconds: Optional[int] = None
    max_seconds: Optional[int] = None
    if duration_bucket == "short":  # 2-5 min
        min_seconds, max_seconds = 120, 300
    elif duration_bucket == "medium":  # 5-15 min
        min_seconds, max_seconds = 300, 900
    elif duration_bucket == "long":  # 15+ min
        min_seconds, max_seconds = 900, None

    if min_seconds is not None:
        query = query.filter(VideoModel.duration >= min_seconds)
    if max_seconds is not None:
        query = query.filter(VideoModel.duration < max_seconds)

    total = query.count()

    rows = (
        query.order_by(VideoModel.published_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    tag_set = set(tags or [])
    items: List[VideoBase] = []
    for video in rows:
        payload = VideoBase.from_orm(video)
        payload.computed_tags = compute_tags_for_video(video)
        if tag_set:
            # Require at least one overlap between requested tags and computed_tags.
            if not any(tag in payload.computed_tags for tag in tag_set):
                continue
        items.append(payload)

    return items, total
