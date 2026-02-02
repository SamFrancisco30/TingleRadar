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
    channel_id: Optional[str] = Query(None),
    duration_bucket: Optional[str] = Query(
        None,
        description="Duration bucket: short (2-5min), medium (5-15min), long (15+min)",
    ),
    tags: Optional[str] = Query(
        None,
        description="Comma-separated internal tag ids (e.g. tapping,no_talking)",
    ),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    tag_list: List[str] = []
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]

    items, total = browse_videos(
        db,
        page=page,
        page_size=page_size,
        channel_id=channel_id,
        duration_bucket=duration_bucket,
        tags=tag_list,
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }
