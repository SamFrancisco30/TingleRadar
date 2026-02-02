from typing import List, Optional, Sequence, Tuple

from sqlalchemy.orm import Session

from app.models import Video as VideoModel
from app.schemas.video import VideoBase
from app.services.tagging import compute_tags_for_video


def _detect_language_from_title(title: str) -> str:
  """Heuristic language detection based on Unicode ranges.

  This mirrors the frontend RankingExplorer behavior so that Weekly and
  Browse views stay consistent.
  """
  for ch in title:
      if "\u3040" <= ch <= "\u30ff" or "\u31f0" <= ch <= "\u31ff":
          return "ja"
  for ch in title:
      if "\uac00" <= ch <= "\ud7af":
          return "ko"
  for ch in title:
      if "\u4e00" <= ch <= "\u9fff":
          return "zh"
  return "en"


def browse_videos(
    db: Session,
    *,
    page: int = 1,
    page_size: int = 50,
    channel_id: Optional[str] = None,
    channel_ids: Optional[Sequence[str]] = None,
    duration_bucket: Optional[str] = None,
    tags: Optional[Sequence[str]] = None,
    language: Optional[str] = None,
    sort: Optional[str] = None,
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

    # Apply ordering based on sort parameter.
    if sort == "views_desc":
        query = query.order_by(VideoModel.view_count.desc(), VideoModel.published_at.desc())
    elif sort == "likes_desc":
        query = query.order_by(VideoModel.like_count.desc(), VideoModel.published_at.desc())
    else:
        # Default: newest first
        query = query.order_by(VideoModel.published_at.desc())

    total = query.count()

    rows = (
        query.offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    tag_set = set(tags or [])
    items: List[VideoBase] = []
    for video in rows:
        payload = VideoBase.from_orm(video)
        payload.computed_tags = compute_tags_for_video(video)

        # Optional language filter using the same heuristic as the frontend
        # (RankingExplorer) so that classification stays consistent.
        if language:
            detected = _detect_language_from_title(payload.title or "")
            if detected != language:
                continue

        if tag_set:
            # Require at least one overlap between requested tags and computed_tags.
            if not any(tag in payload.computed_tags for tag in tag_set):
                continue
        items.append(payload)

    return items, total
