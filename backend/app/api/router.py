from fastapi import APIRouter

from app.api.endpoints import rankings


api_router = APIRouter()
api_router.include_router(rankings.router)
