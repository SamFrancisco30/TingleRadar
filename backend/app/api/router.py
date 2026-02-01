from fastapi import APIRouter

from app.api.endpoints import rankings, youtube


api_router = APIRouter()
api_router.include_router(rankings.router)
api_router.include_router(youtube.router)
