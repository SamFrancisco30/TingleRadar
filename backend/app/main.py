from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import Settings


settings = Settings()

app = FastAPI(title=settings.project_name)

# CORS settings: allow frontend origins to call the API
origins = [
    "https://tingle-radar.vercel.app",
    "https://tingleradar.com",
    "https://www.tingleradar.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/healthz")
def healthcheck() -> dict:
    return {"status": "ok"}
