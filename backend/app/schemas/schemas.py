"""Pydantic v2 request and response schemas for all API models."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AgentProgress(BaseModel):
    """Progress status tracking for an individual agent."""

    agent_name: str
    status: str = Field(..., description="pending, running, completed, or failed")
    message: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


class CompetitorBase(BaseModel):
    """Base schema for competitor data."""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    urls: List[str] = Field(default_factory=list)


class CompetitorCreate(CompetitorBase):
    """Payload to create a new tracked competitor."""

    pass


class CompetitorUpdate(BaseModel):
    """Payload to update an existing competitor."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    urls: Optional[List[str]] = None


class CompetitorResponse(CompetitorBase):
    """Response schema representing a competitor."""

    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SourceResponse(BaseModel):
    """Response schema for retrieved source items."""

    id: int
    research_run_id: int
    url: str
    title: Optional[str] = None
    source_type: str
    content_snippet: Optional[str] = None
    credibility_score: Optional[float] = None
    retrieved_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FindingResponse(BaseModel):
    """Response schema for agent findings."""

    id: int
    research_run_id: int
    source_id: Optional[int] = None
    agent: str
    category: str
    title: str
    content: str
    confidence: float
    evidence_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductIntelResponse(BaseModel):
    """Response schema for product intelligence changes."""

    id: int
    competitor_id: int
    research_run_id: int
    product_name: str
    change_type: str
    description: str
    source_url: Optional[str] = None
    detected_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PricingIntelResponse(BaseModel):
    """Response schema for pricing intelligence events."""

    id: int
    competitor_id: int
    research_run_id: int
    product_name: str
    pricing_model: Optional[str] = None
    price_details: Dict[str, Any] = Field(default_factory=dict)
    change_description: Optional[str] = None
    source_url: Optional[str] = None
    detected_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NewsItemResponse(BaseModel):
    """Response schema for news items."""

    id: int
    competitor_id: int
    research_run_id: int
    title: str
    summary: str
    url: Optional[str] = None
    source_name: Optional[str] = None
    category: str
    published_at: Optional[datetime] = None
    sentiment: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClaimResponse(BaseModel):
    """Response schema for factual claims."""

    id: int
    research_run_id: int
    finding_id: Optional[int] = None
    claim_text: str
    source_agent: str
    verification_status: str
    confidence: float
    evidence: Optional[Any] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConflictResponse(BaseModel):
    """Response schema for conflicting claims."""

    id: int
    research_run_id: int
    claim_a_id: int
    claim_b_id: int
    description: str
    resolution: Optional[str] = None
    resolved: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportResponse(BaseModel):
    """Response schema for synthesized executive report."""

    id: int
    research_run_id: int
    competitor_id: int
    title: str
    executive_summary: str
    sections: Dict[str, Any]
    threat_score: Optional[float] = None
    threat_explanation: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict, validation_alias="metadata_dict"
    )
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ResearchRunCreate(BaseModel):
    """Payload to trigger a new research run."""

    competitor_id: int
    query: str = Field(..., min_length=2)


class ResearchRunResponse(BaseModel):
    """Response schema for research run overview."""

    id: int
    competitor_id: int
    query: str
    status: str
    progress: Dict[str, Any] = Field(default_factory=dict)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResearchRunDetailResponse(ResearchRunResponse):
    """Detailed response schema for research run including all child collections."""

    competitor: Optional[CompetitorResponse] = None
    sources: List[SourceResponse] = Field(default_factory=list)
    findings: List[FindingResponse] = Field(default_factory=list)
    product_intel: List[ProductIntelResponse] = Field(default_factory=list)
    pricing_intel: List[PricingIntelResponse] = Field(default_factory=list)
    news_items: List[NewsItemResponse] = Field(default_factory=list)
    claims: List[ClaimResponse] = Field(default_factory=list)
    conflicts: List[ConflictResponse] = Field(default_factory=list)
    reports: List[ReportResponse] = Field(default_factory=list)


class DashboardStats(BaseModel):
    """Aggregate dashboard metrics."""

    total_competitors: int = 0
    total_runs: int = 0
    total_findings: int = 0
    total_sources: int = 0
    average_threat_score: Optional[float] = None
    latest_reports: List[ReportResponse] = Field(default_factory=list)
    recent_activity: List[ResearchRunResponse] = Field(default_factory=list)
