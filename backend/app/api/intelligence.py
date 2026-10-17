"""Intelligence endpoints for products, pricing, news, reports, and dashboards."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models.models import NewsItem, PricingIntel, ProductIntel, Report
from backend.app.schemas.schemas import (
    NewsItemResponse,
    PricingIntelResponse,
    ProductIntelResponse,
    ReportResponse,
)
from backend.app.services.db_service import get_dashboard_stats

router = APIRouter(prefix="/api/intelligence", tags=["Intelligence"])
alias_router = APIRouter(prefix="/api", tags=["Intelligence Aliases"])


@router.get("/products", response_model=List[ProductIntelResponse])
async def get_product_intelligence(
    competitor_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List product intelligence records with optional competitor filter."""
    stmt = select(ProductIntel).order_by(ProductIntel.detected_at.desc())
    if competitor_id:
        stmt = stmt.where(ProductIntel.competitor_id == competitor_id)
    stmt = stmt.offset(skip).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/pricing", response_model=List[PricingIntelResponse])
async def get_pricing_intelligence(
    competitor_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List pricing models and detected price revisions."""
    stmt = select(PricingIntel).order_by(PricingIntel.detected_at.desc())
    if competitor_id:
        stmt = stmt.where(PricingIntel.competitor_id == competitor_id)
    stmt = stmt.offset(skip).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/news", response_model=List[NewsItemResponse])
async def get_news_intelligence(
    competitor_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List categorized news items and media developments."""
    stmt = select(NewsItem).order_by(NewsItem.created_at.desc())
    if competitor_id:
        stmt = stmt.where(NewsItem.competitor_id == competitor_id)
    if category:
        stmt = stmt.where(NewsItem.category == category)
    stmt = stmt.offset(skip).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/reports", response_model=List[ReportResponse])
async def get_all_reports(
    competitor_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """List executive intelligence reports."""
    stmt = select(Report).order_by(Report.created_at.desc())
    if competitor_id:
        stmt = stmt.where(Report.competitor_id == competitor_id)
    stmt = stmt.offset(skip).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/reports/{id}", response_model=ReportResponse)
async def get_report_by_id(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full executive intelligence report."""
    stmt = select(Report).where(Report.id == id)
    res = await db.execute(stmt)
    report = res.scalar_one_or_none()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {id} not found",
        )
    return report


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Get high-level statistics and intelligence overview for dashboard."""
    stats = await get_dashboard_stats(db)
    return stats


# Attach route handlers to alias router (/api/products, /api/pricing, etc.)
alias_router.add_api_route("/products", get_product_intelligence, methods=["GET"], response_model=List[ProductIntelResponse], include_in_schema=False)
alias_router.add_api_route("/pricing", get_pricing_intelligence, methods=["GET"], response_model=List[PricingIntelResponse], include_in_schema=False)
alias_router.add_api_route("/news", get_news_intelligence, methods=["GET"], response_model=List[NewsItemResponse], include_in_schema=False)
alias_router.add_api_route("/reports", get_all_reports, methods=["GET"], response_model=List[ReportResponse], include_in_schema=False)
alias_router.add_api_route("/reports/{id}", get_report_by_id, methods=["GET"], response_model=ReportResponse, include_in_schema=False)
alias_router.add_api_route("/dashboard", get_dashboard_metrics, methods=["GET"], response_model=Dict[str, Any], include_in_schema=False)
