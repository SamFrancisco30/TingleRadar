from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.services.videos import browse_videos

router = APIRouter(prefix="/videos", tags=["videos"])


@router.get("", response_model=Dict[str, Any])
def list_videos(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    # Legacy single-channel param (kept for compatibility)
    channel_id: Optional[str] = Query(None),
    # New multi-channel param: comma-separated channel ids
    channels: Optional[str] = Query(
        None,
        description="Comma-separated channel ids (e.g. id1,id2,id3)",
    ),
    duration_bucket: Optional[str] = Query(
        None,
        description="Duration bucket: short (2-5min), medium (5-15min), long (15+min)",
    ),
    tags: Optional[str] = Query(
        None,
        description="Comma-separated internal tag ids (e.g. tapping,no_talking)",
    ),
    language: Optional[str] = Query(
        None,
        description="Language code: en, ja, ko, zh (heuristic detection)",
    ),
    sort: Optional[str] = Query(
        None,
        description="Sort key: published_desc (default), views_desc, likes_desc",
    ),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    tag_list: List[str] = []
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]

    channel_list: List[str] = []
    if channels:
        channel_list = [c.strip() for c in channels.split(",") if c.strip()]

    items, total = browse_videos(
        db,
        page=page,
        page_size=page_size,
        channel_id=channel_id,
        channel_ids=channel_list,
        duration_bucket=duration_bucket,
        tags=tag_list,
        language=language,
        sort=sort,
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }
