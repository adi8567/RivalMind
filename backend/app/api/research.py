"""Research orchestration and agent stream endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from backend.app.database import get_db
from backend.app.models.models import Claim, Conflict, Finding, Source
from backend.app.schemas.schemas import (
    ClaimResponse,
    ConflictResponse,
    FindingResponse,
    ResearchRunCreate,
    ResearchRunDetailResponse,
    ResearchRunResponse,
    SourceResponse,
)
from backend.app.services.db_service import (
    get_research_run,
    list_research_runs,
)
from backend.app.services.research_service import (
    progress_stream_generator,
    start_research_run,
)

router = APIRouter(prefix="/api/research", tags=["Research"])


@router.post("/run", response_model=ResearchRunResponse, status_code=status.HTTP_201_CREATED)
@router.post("/runs", response_model=ResearchRunResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def initiate_research_run(
    payload: ResearchRunCreate,
    db: AsyncSession = Depends(get_db),
):
    """Start a new competitive research pipeline execution."""
    try:
        run = await start_research_run(
            competitor_id=payload.competitor_id,
            query=payload.query,
            session=db,
        )
        return run
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate research run: {str(exc)}",
        )


@router.get("/runs", response_model=List[ResearchRunResponse])
async def get_all_research_runs(
    competitor_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List historical and active research runs."""
    return await list_research_runs(db, competitor_id=competitor_id, skip=skip, limit=limit)


@router.get("/runs/{id}", response_model=ResearchRunDetailResponse)
async def get_run_details(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full details of a research run including all agent artifacts."""
    run = await get_research_run(db, id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Research run with ID {id} not found",
        )
    return run


@router.get("/runs/{id}/progress")
async def stream_run_progress(
    id: int,
):
    """Stream live Server-Sent Events (SSE) representing agent execution progress."""
    return EventSourceResponse(progress_stream_generator(id))


@router.get("/sources", response_model=List[SourceResponse])
async def get_all_sources(
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all audited sources across all runs."""
    stmt = select(Source).order_by(Source.retrieved_at.desc()).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/findings", response_model=List[FindingResponse])
async def get_all_findings(
    category: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all findings across all runs."""
    stmt = select(Finding).order_by(Finding.confidence.desc())
    if category:
        stmt = stmt.where(Finding.category == category)
    stmt = stmt.limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/runs/{id}/sources", response_model=List[SourceResponse])
async def get_run_sources(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all sources collected during a specific run."""
    run = await get_research_run(db, id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Research run with ID {id} not found",
        )
    stmt = select(Source).where(Source.research_run_id == id).order_by(Source.retrieved_at.desc())
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/runs/{id}/findings", response_model=List[FindingResponse])
async def get_run_findings(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all agent findings produced during a specific run."""
    run = await get_research_run(db, id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Research run with ID {id} not found",
        )
    stmt = select(Finding).where(Finding.research_run_id == id).order_by(Finding.confidence.desc())
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/runs/{id}/claims", response_model=List[ClaimResponse])
async def get_run_claims(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all claims verified during a specific run."""
    run = await get_research_run(db, id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Research run with ID {id} not found",
        )
    stmt = select(Claim).where(Claim.research_run_id == id).order_by(Claim.created_at.desc())
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/runs/{id}/conflicts", response_model=List[ConflictResponse])
async def get_run_conflicts(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all detected factual conflicts during a specific run."""
    run = await get_research_run(db, id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Research run with ID {id} not found",
        )
    stmt = select(Conflict).where(Conflict.research_run_id == id).order_by(Conflict.created_at.desc())
    res = await db.execute(stmt)
    return list(res.scalars().all())
