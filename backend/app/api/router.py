from fastapi import APIRouter

from app.api.endpoints import rankings, youtube, videos


api_router = APIRouter()
api_router.include_router(rankings.router)
api_router.include_router(youtube.router)
api_router.include_router(videos.router)
