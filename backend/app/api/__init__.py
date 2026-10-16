"""API package exporting routers."""

from backend.app.api.competitors import router as competitors_router
from backend.app.api.intelligence import router as intelligence_router
from backend.app.api.research import router as research_router
from backend.app.api.settings_api import router as settings_router

__all__ = [
    "competitors_router",
    "intelligence_router",
    "research_router",
    "settings_router",
]
