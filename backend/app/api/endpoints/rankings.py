from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.ranking import RankingList
from app.services.rankings import fetch_weekly_rankings, fetch_ranking_by_id

router = APIRouter(prefix="/rankings", tags=["rankings"])


@router.get("/weekly", response_model=List[RankingList])
def list_weekly_rankings(db: Session = Depends(get_db)):
    rankings = fetch_weekly_rankings(db)
    if not rankings:
        raise HTTPException(status_code=404, detail="No rankings available yet")
    return rankings


@router.get("/weekly/{ranking_id}", response_model=RankingList)
def get_weekly_ranking(ranking_id: int, db: Session = Depends(get_db)):
    ranking = fetch_ranking_by_id(db, ranking_id)
    if not ranking:
        raise HTTPException(status_code=404, detail="Ranking not found")
    return ranking
