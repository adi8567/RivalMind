"""Database operations service for CRUD, intelligence persistence, and dashboard analytics."""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.models import (
    Claim,
    Competitor,
    Conflict,
    Finding,
    NewsItem,
    PricingIntel,
    ProductIntel,
    Report,
    ResearchRun,
    Source,
)
from backend.app.schemas.schemas import CompetitorCreate, CompetitorUpdate

logger = logging.getLogger(__name__)


# --- Competitors ---
async def create_competitor(
    session: AsyncSession, comp_in: CompetitorCreate
) -> Competitor:
    """Create a new tracked competitor."""
    competitor = Competitor(
        name=comp_in.name,
        description=comp_in.description,
        website=comp_in.website,
        industry=comp_in.industry,
        urls=comp_in.urls,
    )
    session.add(competitor)
    await session.commit()
    await session.refresh(competitor)
    return competitor


async def get_competitor(
    session: AsyncSession, competitor_id: int
) -> Optional[Competitor]:
    """Retrieve competitor by ID."""
    stmt = select(Competitor).where(Competitor.id == competitor_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_competitors(
    session: AsyncSession, skip: int = 0, limit: int = 100
) -> List[Competitor]:
    """List all competitors ordered by creation date."""
    stmt = (
        select(Competitor)
        .order_by(Competitor.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def update_competitor(
    session: AsyncSession, competitor_id: int, updates: CompetitorUpdate
) -> Optional[Competitor]:
    """Update competitor details."""
    competitor = await get_competitor(session, competitor_id)
    if not competitor:
        return None

    update_data = updates.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(competitor, field, val)

    await session.commit()
    await session.refresh(competitor)
    return competitor


async def delete_competitor(session: AsyncSession, competitor_id: int) -> bool:
    """Delete competitor and associated cascades."""
    competitor = await get_competitor(session, competitor_id)
    if not competitor:
        return False
    await session.delete(competitor)
    await session.commit()
    return True


# --- Research Runs ---
async def create_research_run(
    session: AsyncSession, competitor_id: int, query: str
) -> ResearchRun:
    """Initialize a new research run."""
    run = ResearchRun(
        competitor_id=competitor_id,
        query=query,
        status="pending",
        progress={},
        started_at=datetime.now(timezone.utc),
    )
    session.add(run)
    await session.commit()
    await session.refresh(run)
    return run


async def get_research_run(
    session: AsyncSession, run_id: int
) -> Optional[ResearchRun]:
    """Get research run with eagerly loaded intelligence artifacts."""
    stmt = (
        select(ResearchRun)
        .where(ResearchRun.id == run_id)
        .options(
            selectinload(ResearchRun.competitor),
            selectinload(ResearchRun.sources),
            selectinload(ResearchRun.findings),
            selectinload(ResearchRun.product_intel),
            selectinload(ResearchRun.pricing_intel),
            selectinload(ResearchRun.news_items),
            selectinload(ResearchRun.claims),
            selectinload(ResearchRun.conflicts),
            selectinload(ResearchRun.reports),
        )
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_research_runs(
    session: AsyncSession,
    competitor_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[ResearchRun]:
    """List research runs filtered optionally by competitor."""
    stmt = select(ResearchRun).order_by(ResearchRun.created_at.desc())
    if competitor_id:
        stmt = stmt.where(ResearchRun.competitor_id == competitor_id)
    stmt = stmt.offset(skip).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def update_research_run(
    session: AsyncSession,
    run_id: int,
    status: Optional[str] = None,
    progress: Optional[Dict[str, Any]] = None,
    started_at: Optional[datetime] = None,
    completed_at: Optional[datetime] = None,
    error: Optional[str] = None,
) -> Optional[ResearchRun]:
    """Update progress status and error telemetry for a research run."""
    run = await get_research_run(session, run_id)
    if not run:
        return None

    if status:
        run.status = status
    if progress is not None:
        merged_progress = dict(run.progress or {})
        merged_progress.update(progress)
        run.progress = merged_progress
    if started_at:
        run.started_at = started_at
    if completed_at:
        run.completed_at = completed_at
    if error:
        run.error = error

    await session.commit()
    await session.refresh(run)
    return run


# --- Intelligence Persistence ---
async def save_sources(
    session: AsyncSession, run_id: int, sources: List[Dict[str, Any]]
) -> List[Source]:
    """Persist retrieved sources for a research run."""
    created_sources: List[Source] = []
    for item in sources:
        src = Source(
            research_run_id=run_id,
            url=item.get("url", ""),
            title=item.get("title", ""),
            source_type=item.get("source_type", "website"),
            content_snippet=item.get("content", "") or item.get("content_snippet", ""),
            credibility_score=item.get("credibility", item.get("credibility_score", 0.9)),
            retrieved_at=datetime.now(timezone.utc),
        )
        session.add(src)
        created_sources.append(src)
    await session.commit()
    return created_sources


async def save_findings(
    session: AsyncSession, run_id: int, findings: List[Dict[str, Any]]
) -> List[Finding]:
    """Persist structured findings for a research run."""
    created_findings: List[Finding] = []
    for item in findings:
        finding = Finding(
            research_run_id=run_id,
            source_id=item.get("source_id"),
            agent=item.get("agent", "researcher"),
            category=item.get("category", "strategic"),
            title=item.get("title", "Insight"),
            content=item.get("content", ""),
            confidence=float(item.get("confidence", 0.9)),
            evidence_type=item.get("evidence_type", "retrieved_info"),
            created_at=datetime.now(timezone.utc),
        )
        session.add(finding)
        created_findings.append(finding)
    await session.commit()
    return created_findings


async def save_product_intel(
    session: AsyncSession,
    competitor_id: int,
    run_id: int,
    products: List[Dict[str, Any]],
) -> List[ProductIntel]:
    """Persist product intel events."""
    created: List[ProductIntel] = []
    for item in products:
        pi = ProductIntel(
            competitor_id=competitor_id,
            research_run_id=run_id,
            product_name=item.get("product_name", "Product"),
            change_type=item.get("change_type", "update"),
            description=item.get("description", ""),
            source_url=item.get("source_url"),
            detected_at=item.get("detected_at", datetime.now(timezone.utc)),
            created_at=datetime.now(timezone.utc),
        )
        session.add(pi)
        created.append(pi)
    await session.commit()
    return created


async def save_pricing_intel(
    session: AsyncSession,
    competitor_id: int,
    run_id: int,
    pricing: List[Dict[str, Any]],
) -> List[PricingIntel]:
    """Persist pricing intel records."""
    created: List[PricingIntel] = []
    for item in pricing:
        pi = PricingIntel(
            competitor_id=competitor_id,
            research_run_id=run_id,
            product_name=item.get("product_name", "Pricing Tier"),
            pricing_model=item.get("pricing_model"),
            price_details=item.get("price_details", {}),
            change_description=item.get("change_description"),
            source_url=item.get("source_url"),
            detected_at=item.get("detected_at", datetime.now(timezone.utc)),
            created_at=datetime.now(timezone.utc),
        )
        session.add(pi)
        created.append(pi)
    await session.commit()
    return created


async def save_news_items(
    session: AsyncSession,
    competitor_id: int,
    run_id: int,
    news: List[Dict[str, Any]],
) -> List[NewsItem]:
    """Persist news events."""
    created: List[NewsItem] = []
    for item in news:
        ni = NewsItem(
            competitor_id=competitor_id,
            research_run_id=run_id,
            title=item.get("title", ""),
            summary=item.get("summary", ""),
            url=item.get("url"),
            source_name=item.get("source_name"),
            category=item.get("category", "news"),
            published_at=item.get("published_at", datetime.now(timezone.utc)),
            sentiment=item.get("sentiment", "neutral"),
            created_at=datetime.now(timezone.utc),
        )
        session.add(ni)
        created.append(ni)
    await session.commit()
    return created


async def save_claims(
    session: AsyncSession, run_id: int, claims: List[Dict[str, Any]]
) -> List[Claim]:
    """Persist factual claims."""
    created: List[Claim] = []
    for item in claims:
        cl = Claim(
            research_run_id=run_id,
            finding_id=item.get("finding_id"),
            claim_text=item.get("claim_text", ""),
            source_agent=item.get("source_agent", "verification"),
            verification_status=item.get("verification_status", "verified"),
            confidence=float(item.get("confidence", 0.9)),
            evidence=item.get("evidence"),
            created_at=datetime.now(timezone.utc),
        )
        session.add(cl)
        created.append(cl)
    await session.commit()
    return created


async def save_conflicts(
    session: AsyncSession,
    run_id: int,
    conflicts: List[Dict[str, Any]],
    claims_lookup: Optional[List[Claim]] = None,
) -> List[Conflict]:
    """Persist detected conflicts between claims."""
    created: List[Conflict] = []

    # Map claims if existing
    cid_list = [c.id for c in (claims_lookup or [])]

    for item in conflicts:
        claim_a_id = item.get("claim_a_id")
        claim_b_id = item.get("claim_b_id")

        # Assign fallback claim IDs if resolving from text
        if not claim_a_id and len(cid_list) >= 2:
            claim_a_id = cid_list[0]
            claim_b_id = cid_list[1]
        elif not claim_a_id and len(cid_list) == 1:
            claim_a_id = cid_list[0]
            claim_b_id = cid_list[0]

        if not claim_a_id or not claim_b_id:
            # Create stub claims to preserve DB foreign key integrity if needed
            c_stub_a = Claim(
                research_run_id=run_id,
                claim_text=item.get("claim_a", "Primary Claim"),
                source_agent="verification",
                verification_status="conflicting",
                confidence=0.5,
            )
            c_stub_b = Claim(
                research_run_id=run_id,
                claim_text=item.get("claim_b", "Secondary Claim"),
                source_agent="verification",
                verification_status="conflicting",
                confidence=0.5,
            )
            session.add(c_stub_a)
            session.add(c_stub_b)
            await session.flush()
            claim_a_id = c_stub_a.id
            claim_b_id = c_stub_b.id

        cf = Conflict(
            research_run_id=run_id,
            claim_a_id=claim_a_id,
            claim_b_id=claim_b_id,
            description=item.get("description", "Claim divergence"),
            resolution=item.get("resolution"),
            resolved=item.get("resolved", False),
            created_at=datetime.now(timezone.utc),
        )
        session.add(cf)
        created.append(cf)
    await session.commit()
    return created


async def save_report(
    session: AsyncSession,
    competitor_id: int,
    run_id: int,
    report: Dict[str, Any],
) -> Report:
    """Persist synthesized intelligence report."""
    rep = Report(
        research_run_id=run_id,
        competitor_id=competitor_id,
        title=report.get("title", "Executive Competitive Intelligence Report"),
        executive_summary=report.get("executive_summary", "Summary pending"),
        sections=report.get("sections", {}),
        threat_score=report.get("threat_score"),
        threat_explanation=report.get("threat_explanation"),
        metadata_dict=report.get("metadata", {}),
        created_at=datetime.now(timezone.utc),
    )
    session.add(rep)
    await session.commit()
    await session.refresh(rep)
    return rep


# --- Dashboard Stats ---
async def get_dashboard_stats(session: AsyncSession) -> Dict[str, Any]:
    """Compute top-level analytics for competitive intelligence dashboard."""
    total_competitors = await session.scalar(select(func.count(Competitor.id))) or 0
    total_runs = await session.scalar(select(func.count(ResearchRun.id))) or 0
    total_findings = await session.scalar(select(func.count(Finding.id))) or 0
    total_sources = await session.scalar(select(func.count(Source.id))) or 0
    avg_threat = await session.scalar(select(func.avg(Report.threat_score)))

    # Fetch latest reports
    reports_stmt = (
        select(Report)
        .order_by(Report.created_at.desc())
        .limit(5)
    )
    reports_res = await session.execute(reports_stmt)
    latest_reports = list(reports_res.scalars().all())

    # Fetch recent runs
    runs_stmt = (
        select(ResearchRun)
        .order_by(ResearchRun.created_at.desc())
        .limit(5)
    )
    runs_res = await session.execute(runs_stmt)
    recent_activity = list(runs_res.scalars().all())

    return {
        "total_competitors": total_competitors,
        "total_runs": total_runs,
        "total_findings": total_findings,
        "total_sources": total_sources,
        "average_threat_score": round(float(avg_threat), 2) if avg_threat is not None else None,
        "latest_reports": latest_reports,
        "recent_activity": recent_activity,
    }
