"""Competitor management endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.schemas.schemas import (
    CompetitorCreate,
    CompetitorResponse,
    CompetitorUpdate,
    ResearchRunResponse,
)
from backend.app.services.db_service import (
    create_competitor,
    delete_competitor,
    get_competitor,
    list_competitors,
    list_research_runs,
    update_competitor,
)

router = APIRouter(prefix="/api/competitors", tags=["Competitors"])


@router.get("", response_model=List[CompetitorResponse])
@router.get("/", response_model=List[CompetitorResponse], include_in_schema=False)
async def get_all_competitors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve list of tracked competitors."""
    return await list_competitors(db, skip=skip, limit=limit)


@router.post("", response_model=CompetitorResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=CompetitorResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_new_competitor(
    payload: CompetitorCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new competitor profile."""
    return await create_competitor(db, payload)


@router.get("/{id}", response_model=CompetitorResponse)
async def get_single_competitor(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get competitor details by ID."""
    competitor = await get_competitor(db, id)
    if not competitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Competitor with ID {id} not found",
        )
    return competitor


@router.put("/{id}", response_model=CompetitorResponse)
async def update_single_competitor(
    id: int,
    payload: CompetitorUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update competitor details."""
    updated = await update_competitor(db, id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Competitor with ID {id} not found",
        )
    return updated


@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_single_competitor(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Remove competitor and associated research runs."""
    deleted = await delete_competitor(db, id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Competitor with ID {id} not found",
        )
    return {"status": "success", "message": f"Competitor {id} deleted successfully"}


@router.get("/{id}/history", response_model=List[ResearchRunResponse])
async def get_competitor_history(
    id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get historical research runs for a competitor."""
    competitor = await get_competitor(db, id)
    if not competitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Competitor with ID {id} not found",
        )
    return await list_research_runs(db, competitor_id=id, skip=skip, limit=limit)
