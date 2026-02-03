from fastapi import APIRouter

from app.api.endpoints import channels, rankings, youtube, videos, tag_votes


api_router = APIRouter()
api_router.include_router(rankings.router)
api_router.include_router(youtube.router)
api_router.include_router(videos.router)
api_router.include_router(channels.router)
api_router.include_router(tag_votes.router)
