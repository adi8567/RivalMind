"""SQLAlchemy ORM models for Multi-Agent Competitive Intelligence Orchestrator."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database import Base


def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)


class Competitor(Base):
    """Competitor profile being tracked and monitored."""

    __tablename__ = "competitors"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    urls: Mapped[List[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    # Relationships
    research_runs: Mapped[List["ResearchRun"]] = relationship(
        "ResearchRun", back_populates="competitor", cascade="all, delete-orphan"
    )
    product_intel: Mapped[List["ProductIntel"]] = relationship(
        "ProductIntel", back_populates="competitor", cascade="all, delete-orphan"
    )
    pricing_intel: Mapped[List["PricingIntel"]] = relationship(
        "PricingIntel", back_populates="competitor", cascade="all, delete-orphan"
    )
    news_items: Mapped[List["NewsItem"]] = relationship(
        "NewsItem", back_populates="competitor", cascade="all, delete-orphan"
    )
    reports: Mapped[List["Report"]] = relationship(
        "Report", back_populates="competitor", cascade="all, delete-orphan"
    )


class ResearchRun(Base):
    """Execution record of an intelligence gathering query for a competitor."""

    __tablename__ = "research_runs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    competitor_id: Mapped[int] = mapped_column(
        ForeignKey("competitors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    query: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default="pending", index=True
    )  # pending, running, completed, failed
    progress: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )

    # Relationships
    competitor: Mapped["Competitor"] = relationship(
        "Competitor", back_populates="research_runs"
    )
    sources: Mapped[List["Source"]] = relationship(
        "Source", back_populates="research_run", cascade="all, delete-orphan"
    )
    findings: Mapped[List["Finding"]] = relationship(
        "Finding", back_populates="research_run", cascade="all, delete-orphan"
    )
    product_intel: Mapped[List["ProductIntel"]] = relationship(
        "ProductIntel", back_populates="research_run", cascade="all, delete-orphan"
    )
    pricing_intel: Mapped[List["PricingIntel"]] = relationship(
        "PricingIntel", back_populates="research_run", cascade="all, delete-orphan"
    )
    news_items: Mapped[List["NewsItem"]] = relationship(
        "NewsItem", back_populates="research_run", cascade="all, delete-orphan"
    )
    claims: Mapped[List["Claim"]] = relationship(
        "Claim", back_populates="research_run", cascade="all, delete-orphan"
    )
    conflicts: Mapped[List["Conflict"]] = relationship(
        "Conflict", back_populates="research_run", cascade="all, delete-orphan"
    )
    reports: Mapped[List["Report"]] = relationship(
        "Report", back_populates="research_run", cascade="all, delete-orphan"
    )


class Source(Base):
    """Source reference retrieved during research."""

    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    research_run_id: Mapped[int] = mapped_column(
        ForeignKey("research_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    source_type: Mapped[str] = mapped_column(
        String(50), default="website"
    )  # website, filing, news, document
    content_snippet: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    credibility_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    retrieved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )

    # Relationships
    research_run: Mapped["ResearchRun"] = relationship(
        "ResearchRun", back_populates="sources"
    )
    findings: Mapped[List["Finding"]] = relationship(
        "Finding", back_populates="source"
    )


class Finding(Base):
    """Structured insight or observation extracted by an agent."""

    __tablename__ = "findings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    research_run_id: Mapped[int] = mapped_column(
        ForeignKey("research_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("sources.id", ondelete="SET NULL"), nullable=True, index=True
    )
    agent: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # agent responsible
    category: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # product, pricing, financial, news, strategic
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)  # 0.0 - 1.0
    evidence_type: Mapped[str] = mapped_column(
        String(100), default="retrieved_info"
    )  # verified_fact, retrieved_info, ai_interpretation
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )

    # Relationships
    research_run: Mapped["ResearchRun"] = relationship(
        "ResearchRun", back_populates="findings"
    )
    source: Mapped[Optional["Source"]] = relationship(
        "Source", back_populates="findings"
    )
    claims: Mapped[List["Claim"]] = relationship(
        "Claim", back_populates="finding"
    )


class ProductIntel(Base):
    """Product intelligence event (launch, update, feature, deprecation)."""

    __tablename__ = "product_intel"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    competitor_id: Mapped[int] = mapped_column(
        ForeignKey("competitors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    research_run_id: Mapped[int] = mapped_column(
        ForeignKey("research_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    change_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # launch, update, deprecation, feature
    description: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )

    # Relationships
    competitor: Mapped["Competitor"] = relationship(
        "Competitor", back_populates="product_intel"
    )
    research_run: Mapped["ResearchRun"] = relationship(
        "ResearchRun", back_populates="product_intel"
    )


class PricingIntel(Base):
    """Pricing model details and detected price changes."""

    __tablename__ = "pricing_intel"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    competitor_id: Mapped[int] = mapped_column(
        ForeignKey("competitors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    research_run_id: Mapped[int] = mapped_column(
        ForeignKey("research_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    pricing_model: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    price_details: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    change_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )

    # Relationships
    competitor: Mapped["Competitor"] = relationship(
        "Competitor", back_populates="pricing_intel"
    )
    research_run: Mapped["ResearchRun"] = relationship(
        "ResearchRun", back_populates="pricing_intel"
    )


class NewsItem(Base):
    """Categorized external news development."""

    __tablename__ = "news_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    competitor_id: Mapped[int] = mapped_column(
        ForeignKey("competitors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    research_run_id: Mapped[int] = mapped_column(
        ForeignKey("research_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    source_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    sentiment: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )

    # Relationships
    competitor: Mapped["Competitor"] = relationship(
        "Competitor", back_populates="news_items"
    )
    research_run: Mapped["ResearchRun"] = relationship(
        "ResearchRun", back_populates="news_items"
    )


class Claim(Base):
    """Extracted claim checked by verification agent."""

    __tablename__ = "claims"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    research_run_id: Mapped[int] = mapped_column(
        ForeignKey("research_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    finding_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("findings.id", ondelete="SET NULL"), nullable=True, index=True
    )
    claim_text: Mapped[str] = mapped_column(Text, nullable=False)
    source_agent: Mapped[str] = mapped_column(String(100), nullable=False)
    verification_status: Mapped[str] = mapped_column(
        String(50), default="pending"
    )  # pending, verified, conflicting, unverifiable
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    evidence: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )

    # Relationships
    research_run: Mapped["ResearchRun"] = relationship(
        "ResearchRun", back_populates="claims"
    )
    finding: Mapped[Optional["Finding"]] = relationship(
        "Finding", back_populates="claims"
    )


class Conflict(Base):
    """Detected conflict between distinct claims or sources."""

    __tablename__ = "conflicts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    research_run_id: Mapped[int] = mapped_column(
        ForeignKey("research_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    claim_a_id: Mapped[int] = mapped_column(
        ForeignKey("claims.id", ondelete="CASCADE"), nullable=False
    )
    claim_b_id: Mapped[int] = mapped_column(
        ForeignKey("claims.id", ondelete="CASCADE"), nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    resolution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )

    # Relationships
    research_run: Mapped["ResearchRun"] = relationship(
        "ResearchRun", back_populates="conflicts"
    )
    claim_a: Mapped["Claim"] = relationship("Claim", foreign_keys=[claim_a_id])
    claim_b: Mapped["Claim"] = relationship("Claim", foreign_keys=[claim_b_id])


class Report(Base):
    """Synthesized competitive intelligence report."""

    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    research_run_id: Mapped[int] = mapped_column(
        ForeignKey("research_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    competitor_id: Mapped[int] = mapped_column(
        ForeignKey("competitors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    executive_summary: Mapped[str] = mapped_column(Text, nullable=False)
    sections: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    threat_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    threat_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Map DB column "metadata" to attribute metadata_dict to avoid collision with Base.metadata
    metadata_dict: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        "metadata", JSON, nullable=True, default=dict
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )

    # Relationships
    research_run: Mapped["ResearchRun"] = relationship(
        "ResearchRun", back_populates="reports"
    )
    competitor: Mapped["Competitor"] = relationship(
        "Competitor", back_populates="reports"
    )
