from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.schemas.ranking import RankingList
from app.services.rankings import fetch_weekly_rankings

router = APIRouter(prefix="/rankings", tags=["rankings"])


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/weekly", response_model=List[RankingList])
def list_weekly_rankings(db: Session = Depends(get_db)):
    rankings = fetch_weekly_rankings(db)
    if not rankings:
        raise HTTPException(status_code=404, detail="No rankings available yet")
    return rankings
