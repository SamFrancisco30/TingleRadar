from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.services.channels import list_top_channels

router = APIRouter(prefix="/channels", tags=["channels"])


@router.get("/popular", response_model=List[Dict[str, Any]])
def popular_channels(
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    rows = list_top_channels(db, limit=limit)
    return [
        {
            "channel_id": channel_id,
            "channel_title": channel_title,
            "video_count": count,
        }
        for channel_id, channel_title, count in rows
    ]
