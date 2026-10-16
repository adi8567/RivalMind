"""Application configuration using Pydantic Settings."""

from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and defaults."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/ci_orchestrator"
    )
    SYNC_DATABASE_URL: str = (
        "postgresql://postgres:postgres@localhost:5432/ci_orchestrator"
    )
    LLM_PROVIDER: str = "openai"
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_API_KEY: str = ""
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX: str = "ci-orchestrator"
    NEWS_API_KEY: str = ""
    DEMO_MODE: bool = True
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000"]
    LOG_LEVEL: str = "INFO"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse comma-separated string into list if needed."""
        if isinstance(v, str):
            if v.strip().startswith("[") and v.strip().endswith("]"):
                import json

                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v


settings = Settings()
