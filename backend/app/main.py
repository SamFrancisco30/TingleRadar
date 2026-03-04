from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import Settings


settings = Settings()

app = FastAPI(title=settings.project_name)

# CORS settings: include production domains plus local dev origins.
def _build_cors_origins() -> list[str]:
    origins = {
        "https://tingle-radar.vercel.app",
        "https://tingleradar.com",
        "https://www.tingleradar.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    }
    if settings.frontend_cors_origins:
        configured = [o.strip() for o in settings.frontend_cors_origins.split(",") if o.strip()]
        origins.update(configured)
    return sorted(origins)


app.add_middleware(
    CORSMiddleware,
    allow_origins=_build_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/healthz")
def healthcheck() -> dict:
    return {"status": "ok"}

