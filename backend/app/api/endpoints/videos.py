from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.video import VideoBase
from app.services.videos import browse_videos

router = APIRouter(prefix="/videos", tags=["videos"])


@router.get("", response_model=Dict[str, Any])
def list_videos(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    channel_id: str = Query(None),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    items, total = browse_videos(
        db,
        page=page,
        page_size=page_size,
        channel_id=channel_id,
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }
