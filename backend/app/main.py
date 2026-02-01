from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import Settings


settings = Settings()

app = FastAPI(title=settings.project_name)
app.include_router(api_router, prefix="/api")


@app.get("/healthz")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
