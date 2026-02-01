from pathlib import Path
from typing import Optional

from pydantic import BaseSettings


class Settings(BaseSettings):
    project_name: str = "TingleRadar"
    database_url: str
    supabase_service_role_key: str
    youtube_api_key: Optional[str] = None
    youtube_client_id: Optional[str] = None
    youtube_client_secret: Optional[str] = None
    youtube_oauth_redirect: Optional[str] = None

    class Config:
        env_file = Path(__file__).resolve().parents[2] / ".env"
        env_file_encoding = "utf-8"
