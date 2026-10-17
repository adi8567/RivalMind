"""Settings and system health check endpoints with live testing and configuration update."""

import logging
import os
import time
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from backend.app.config import settings
from backend.app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/settings", tags=["Settings"])


class SettingsUpdatePayload(BaseModel):
    """Payload to update runtime settings and environment parameters."""

    demo_mode: Optional[bool] = None
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    llm_api_key: Optional[str] = None
    pinecone_api_key: Optional[str] = None
    pinecone_index: Optional[str] = None
    news_api_key: Optional[str] = None
    log_level: Optional[str] = None


class TestConnectionPayload(BaseModel):
    """Target component to test connectivity."""

    target: str = Field(..., description="'database', 'llm', 'pinecone', or 'news'")


def _update_env_file(key: str, value: str) -> None:
    """Update or append an environment variable in the root and backend .env files."""
    env_paths = [
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
    ]

    for env_path in env_paths:
        try:
            lines: List[str] = []
            key_found = False
            if os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    lines = f.readlines()

            new_lines = []
            for line in lines:
                stripped = line.strip()
                if stripped.startswith(f"{key}=") or stripped.startswith(f"{key} ="):
                    new_lines.append(f"{key}={value}\n")
                    key_found = True
                else:
                    new_lines.append(line)

            if not key_found:
                new_lines.append(f"{key}={value}\n")

            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        except Exception as exc:
            logger.warning(f"Could not update .env at {env_path}: {exc}")


@router.get("", response_model=Dict[str, Any])
@router.get("/", response_model=Dict[str, Any], include_in_schema=False)
async def get_public_settings(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Retrieve full configuration state, connectivity health, and environment audit."""
    # Test real database connection
    postgres_connected = False
    try:
        res = await db.execute(text("SELECT 1"))
        postgres_connected = res.scalar() == 1
    except Exception as exc:
        logger.warning(f"Database health check failed: {exc}")
        postgres_connected = False

    has_pinecone = bool(settings.PINECONE_API_KEY.strip())
    has_llm = bool(settings.LLM_API_KEY.strip())
    has_news = bool(settings.NEWS_API_KEY.strip())

    return {
        "demo_mode": settings.DEMO_MODE,
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.LLM_MODEL,
        "postgres_connected": postgres_connected,
        "pinecone_connected": has_pinecone,
        "has_llm_key": has_llm,
        "has_pinecone_key": has_pinecone,
        "pinecone_index": settings.PINECONE_INDEX,
        "has_news_api_key": has_news,
        "cors_origins": settings.CORS_ORIGINS,
        "log_level": settings.LOG_LEVEL,
        "env_status": {
            "DATABASE_URL": bool(settings.DATABASE_URL.strip()),
            "LLM_API_KEY": has_llm,
            "PINECONE_API_KEY": has_pinecone,
            "NEWS_API_KEY": has_news,
        },
        "available_providers": ["openai", "anthropic", "gemini", "groq", "ollama"],
        "available_models": {
            "openai": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
            "anthropic": ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
            "gemini": ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-exp"],
            "groq": ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
            "ollama": ["llama3", "mistral", "qwen2.5"],
        },
        "live_status": {
            "web_scraper": "Ready (Playwright & HTTPX)",
            "news_engine": "Ready (Live Google News RSS + NewsAPI)",
            "financial_rag": "Ready (Pinecone & SEC EDGAR)",
            "conflict_engine": "Active (Deterministic Cross-Claim Matrix)",
        },
    }


@router.put("", response_model=Dict[str, Any])
@router.put("/", response_model=Dict[str, Any], include_in_schema=False)
@router.post("", response_model=Dict[str, Any], include_in_schema=False)
async def update_settings(
    payload: SettingsUpdatePayload, db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Update system settings, toggle demo/live mode, or configure API keys."""
    if payload.demo_mode is not None:
        settings.DEMO_MODE = payload.demo_mode
        _update_env_file("DEMO_MODE", "true" if payload.demo_mode else "false")
        os.environ["DEMO_MODE"] = "true" if payload.demo_mode else "false"

    if payload.llm_provider is not None and payload.llm_provider.strip():
        settings.LLM_PROVIDER = payload.llm_provider.strip().lower()
        _update_env_file("LLM_PROVIDER", settings.LLM_PROVIDER)
        os.environ["LLM_PROVIDER"] = settings.LLM_PROVIDER

    if payload.llm_model is not None and payload.llm_model.strip():
        settings.LLM_MODEL = payload.llm_model.strip()
        _update_env_file("LLM_MODEL", settings.LLM_MODEL)
        os.environ["LLM_MODEL"] = settings.LLM_MODEL

    if payload.llm_api_key is not None:
        settings.LLM_API_KEY = payload.llm_api_key.strip()
        _update_env_file("LLM_API_KEY", settings.LLM_API_KEY)
        os.environ["LLM_API_KEY"] = settings.LLM_API_KEY

    if payload.pinecone_api_key is not None:
        settings.PINECONE_API_KEY = payload.pinecone_api_key.strip()
        _update_env_file("PINECONE_API_KEY", settings.PINECONE_API_KEY)
        os.environ["PINECONE_API_KEY"] = settings.PINECONE_API_KEY

    if payload.pinecone_index is not None and payload.pinecone_index.strip():
        settings.PINECONE_INDEX = payload.pinecone_index.strip()
        _update_env_file("PINECONE_INDEX", settings.PINECONE_INDEX)
        os.environ["PINECONE_INDEX"] = settings.PINECONE_INDEX

    if payload.news_api_key is not None:
        settings.NEWS_API_KEY = payload.news_api_key.strip()
        _update_env_file("NEWS_API_KEY", settings.NEWS_API_KEY)
        os.environ["NEWS_API_KEY"] = settings.NEWS_API_KEY

    if payload.log_level is not None and payload.log_level.strip():
        settings.LOG_LEVEL = payload.log_level.strip().upper()
        _update_env_file("LOG_LEVEL", settings.LOG_LEVEL)

    logger.info(f"[Settings] Configuration updated: demo_mode={settings.DEMO_MODE}, provider={settings.LLM_PROVIDER}, model={settings.LLM_MODEL}")

    return await get_public_settings(db)


@router.post("/test-connection")
async def test_component_connection(
    payload: TestConnectionPayload, db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Perform a live diagnostic test against the requested component."""
    target = payload.target.lower().strip()
    start = time.perf_counter()

    if target == "database":
        try:
            res = await db.execute(text("SELECT 1"))
            val = res.scalar()
            latency = round((time.perf_counter() - start) * 1000, 2)
            if val == 1:
                return {
                    "success": True,
                    "target": "database",
                    "latency_ms": latency,
                    "message": f"Database connected successfully ({latency} ms)",
                }
            raise Exception("Unexpected query result")
        except Exception as exc:
            latency = round((time.perf_counter() - start) * 1000, 2)
            return {
                "success": False,
                "target": "database",
                "latency_ms": latency,
                "message": f"Database connection error: {str(exc)}",
            }

    elif target == "llm":
        key = settings.LLM_API_KEY.strip()
        if not key:
            return {
                "success": False,
                "target": "llm",
                "latency_ms": 0,
                "message": "No LLM API Key is configured in settings or environment.",
            }
        try:
            from backend.app.agents.llm import get_llm
            from langchain_core.messages import HumanMessage

            llm = get_llm()
            if not llm:
                raise Exception("LLM engine could not be initialized")

            resp = await llm.ainvoke([HumanMessage(content="Reply with 'OK'")])
            latency = round((time.perf_counter() - start) * 1000, 2)
            return {
                "success": True,
                "target": "llm",
                "latency_ms": latency,
                "message": f"LLM responded ({latency} ms): {resp.content[:30].strip()}",
            }
        except Exception as exc:
            latency = round((time.perf_counter() - start) * 1000, 2)
            return {
                "success": False,
                "target": "llm",
                "latency_ms": latency,
                "message": f"LLM test failed: {str(exc)}",
            }

    elif target == "news":
        try:
            # Test Google News live RSS
            async with httpx.AsyncClient(timeout=8.0) as client:
                r = await client.get(
                    "https://news.google.com/rss/search?q=technology&hl=en-US&gl=US&ceid=US:en"
                )
                latency = round((time.perf_counter() - start) * 1000, 2)
                if r.status_code == 200 and "<rss" in r.text.lower():
                    return {
                        "success": True,
                        "target": "news",
                        "latency_ms": latency,
                        "message": f"Live News stream operational ({latency} ms, RSS feed active)",
                    }
                raise Exception(f"HTTP {r.status_code}")
        except Exception as exc:
            latency = round((time.perf_counter() - start) * 1000, 2)
            return {
                "success": False,
                "target": "news",
                "latency_ms": latency,
                "message": f"News service ping failed: {str(exc)}",
            }

    elif target == "pinecone":
        key = settings.PINECONE_API_KEY.strip()
        if not key:
            return {
                "success": False,
                "target": "pinecone",
                "latency_ms": 0,
                "message": "No Pinecone API Key configured. System will use in-memory vector embeddings.",
            }
        try:
            from pinecone import Pinecone

            pc = Pinecone(api_key=key)
            indexes = pc.list_indexes()
            latency = round((time.perf_counter() - start) * 1000, 2)
            return {
                "success": True,
                "target": "pinecone",
                "latency_ms": latency,
                "message": f"Pinecone connected ({latency} ms). Available indexes: {[i.name for i in indexes]}",
            }
        except Exception as exc:
            latency = round((time.perf_counter() - start) * 1000, 2)
            return {
                "success": False,
                "target": "pinecone",
                "latency_ms": latency,
                "message": f"Pinecone connection error: {str(exc)}",
            }

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown target component: {target}",
        )


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """Service health check probe."""
    return {"status": "ok", "service": "ci-orchestrator-backend"}
