from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Engineering Intelligence Platform"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = True
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_username: str = "neo4j"
    neo4j_password: str = "neo4jadmin"

    database_url: str = (
        "postgresql+psycopg://postgres:admin@localhost:5432/"
        "repository_intelligence"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",

    )


@lru_cache
def get_settings() -> Settings:
    return Settings()