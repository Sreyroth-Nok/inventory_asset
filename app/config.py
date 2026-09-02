import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Inventory & Asset Management API"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "inventory_super_secret_jwt_key_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database Settings
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/inventory_db"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
