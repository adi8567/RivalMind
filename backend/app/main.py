"""FastAPI application entry point for Multi-Agent CI Orchestrator."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, select

from backend.app.api.competitors import router as competitors_router
from backend.app.api.intelligence import router as intelligence_router
from backend.app.api.research import router as research_router
from backend.app.api.settings_api import router as settings_router
from backend.app.config import settings
from backend.app.database import AsyncSessionLocal, init_db
from backend.app.models.models import Competitor
from backend.app.services.demo_data import DEMO_COMPETITOR

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ci_orchestrator")


async def seed_demo_competitor_if_needed() -> None:
    """Seed default Microsoft competitor profile if database has zero competitors."""
    try:
        async with AsyncSessionLocal() as session:
            count = await session.scalar(select(func.count(Competitor.id))) or 0
            if count == 0:
                logger.info("Database empty; seeding default Microsoft competitor profile...")
                demo_comp = Competitor(
                    name=DEMO_COMPETITOR["name"],
                    description=DEMO_COMPETITOR["description"],
                    website=DEMO_COMPETITOR["website"],
                    industry=DEMO_COMPETITOR["industry"],
                    urls=DEMO_COMPETITOR["urls"],
                )
                session.add(demo_comp)
                await session.commit()
                logger.info(f"Seeded competitor '{demo_comp.name}' (ID={demo_comp.id}).")
    except Exception as exc:
        logger.warning(f"Could not verify or seed initial competitor: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan event handler for startup table creation and shutdown cleanup."""
    logger.info("Initializing CI Orchestrator backend service...")
    try:
        await init_db()
        await seed_demo_competitor_if_needed()
    except Exception as exc:
        logger.error(f"Startup database initialization error: {exc}")

    yield

    logger.info("Shutting down CI Orchestrator backend service...")


app = FastAPI(
    title="Multi-Agent Competitive Intelligence Orchestrator",
    description="Automated competitive research pipeline powered by LangGraph, FastAPI, and SQLAlchemy.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(competitors_router)
app.include_router(research_router)
app.include_router(intelligence_router)
app.include_router(settings_router)


# Global Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle schema validation errors."""
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "message": "Input validation error"},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle standard HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch unhandled internal server exceptions."""
    logger.error(f"Unhandled server exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please consult backend logs."},
    )


@app.get("/", tags=["Health"])
@app.get("/health", tags=["Health"])
async def root_health_check():
    """Root health and liveness endpoint."""
    return {
        "status": "online",
        "service": "Multi-Agent Competitive Intelligence Orchestrator",
        "demo_mode": settings.DEMO_MODE,
    }
