"""Settings and system health check endpoints."""

from typing import Any, Dict
from fastapi import APIRouter
from backend.app.config import settings

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("", response_model=Dict[str, Any])
@router.get("/", response_model=Dict[str, Any], include_in_schema=False)
async def get_public_settings() -> Dict[str, Any]:
    """Retrieve application configuration excluding sensitive credentials."""
    return {
        "demo_mode": settings.DEMO_MODE,
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.LLM_MODEL,
        "has_llm_key": bool(settings.LLM_API_KEY.strip()),
        "has_pinecone_key": bool(settings.PINECONE_API_KEY.strip()),
        "pinecone_index": settings.PINECONE_INDEX,
        "has_news_api_key": bool(settings.NEWS_API_KEY.strip()),
        "cors_origins": settings.CORS_ORIGINS,
        "log_level": settings.LOG_LEVEL,
    }


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """Service health check probe."""
    return {"status": "ok", "service": "ci-orchestrator-backend"}
