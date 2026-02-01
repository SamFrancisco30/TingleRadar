from pydantic import BaseSettings


class Settings(BaseSettings):
    project_name: str = "TingleRadar"
    database_url: str
    supabase_service_role_key: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
