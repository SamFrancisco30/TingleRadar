from typing import List, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Video as VideoModel


def list_top_channels(db: Session, limit: int = 30) -> List[Tuple[str, str, int]]:
    """Return the most frequent channels in the videos catalog.

    Result is a list of (channel_id, channel_title, video_count), ordered by
    video_count desc then channel_title asc.
    """

    rows = (
        db.query(
            VideoModel.channel_id,
            VideoModel.channel_title,
            func.count(VideoModel.youtube_id).label("video_count"),
        )
        .group_by(VideoModel.channel_id, VideoModel.channel_title)
        .order_by(func.count(VideoModel.youtube_id).desc(), VideoModel.channel_title.asc())
        .limit(limit)
        .all()
    )

    return [(r.channel_id, r.channel_title, int(r.video_count)) for r in rows]
