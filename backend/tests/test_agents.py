"""Unit tests for multi-agent pipeline in demo mode."""

import pytest

from backend.app.agents.financial_rag import run_financial_rag
from backend.app.agents.news import run_news
from backend.app.agents.orchestrator import run_orchestrator
from backend.app.agents.planner import plan_research_tasks
from backend.app.agents.product_pricing import run_product_pricing
from backend.app.agents.state import OrchestratorState
from backend.app.agents.synthesis import run_synthesis
from backend.app.agents.verification import run_verification
from backend.app.agents.web_research import run_web_research


@pytest.fixture
def base_state() -> OrchestratorState:
    """Fixture providing an initial pipeline state."""
    return {
        "competitor_name": "Microsoft Corporation",
        "competitor_urls": ["https://www.microsoft.com", "https://azure.microsoft.com"],
        "query": "Assess Microsoft 365 Copilot pricing and enterprise cloud traction.",
        "research_run_id": 1,
        "research_tasks": [],
        "sources": [],
        "findings": [],
        "product_intel": [],
        "pricing_intel": [],
        "financial_intel": [],
        "news_items": [],
        "claims": [],
        "conflicts": [],
        "report": None,
        "agent_progress": {},
        "errors": [],
        "demo_mode": True,
    }


@pytest.mark.asyncio
async def test_planner_agent(base_state: OrchestratorState):
    """Test planner agent decomposes tasks and updates progress."""
    result = await plan_research_tasks(base_state)
    assert "research_tasks" in result
    assert len(result["research_tasks"]) >= 5
    assert result["agent_progress"]["planner"]["status"] == "completed"


@pytest.mark.asyncio
async def test_web_research_agent(base_state: OrchestratorState):
    """Test web research extracts sources and findings in demo mode."""
    result = await run_web_research(base_state)
    assert "sources" in result
    assert "findings" in result
    assert len(result["sources"]) > 0
    assert result["agent_progress"]["web_research"]["status"] == "completed"


@pytest.mark.asyncio
async def test_product_pricing_agent(base_state: OrchestratorState):
    """Test product and pricing agent populates tiers and features."""
    result = await run_product_pricing(base_state)
    assert "product_intel" in result
    assert "pricing_intel" in result
    assert len(result["pricing_intel"]) > 0
    assert result["agent_progress"]["product_pricing"]["status"] == "completed"


@pytest.mark.asyncio
async def test_financial_rag_agent(base_state: OrchestratorState):
    """Test financial intelligence agent cites filings without fabricating numbers."""
    result = await run_financial_rag(base_state)
    assert "financial_intel" in result
    assert len(result["financial_intel"]) > 0
    assert result["agent_progress"]["financial_rag"]["status"] == "completed"


@pytest.mark.asyncio
async def test_news_agent(base_state: OrchestratorState):
    """Test news agent returns categorized articles with sentiment."""
    result = await run_news(base_state)
    assert "news_items" in result
    assert len(result["news_items"]) > 0
    item = result["news_items"][0]
    assert "category" in item
    assert "sentiment" in item
    assert result["agent_progress"]["news"]["status"] == "completed"


@pytest.mark.asyncio
async def test_verification_agent(base_state: OrchestratorState):
    """Test verification agent identifies claims and surfaces conflicts."""
    result = await run_verification(base_state)
    assert "claims" in result
    assert "conflicts" in result
    assert len(result["claims"]) > 0
    assert len(result["conflicts"]) > 0
    assert result["agent_progress"]["verification"]["status"] == "completed"


@pytest.mark.asyncio
async def test_synthesis_agent(base_state: OrchestratorState):
    """Test synthesis agent compiles complete executive report."""
    result = await run_synthesis(base_state)
    assert "report" in result
    rep = result["report"]
    assert "title" in rep
    assert "executive_summary" in rep
    assert "sections" in rep
    assert "threat_score" in rep
    assert result["agent_progress"]["synthesis"]["status"] == "completed"


@pytest.mark.asyncio
async def test_full_orchestrator_pipeline():
    """Test end-to-end multi-agent orchestration yielding step-by-step progress."""
    events = []
    async for event in run_orchestrator(
        competitor_name="Microsoft Corporation",
        competitor_urls=["https://www.microsoft.com"],
        query="Comprehensive competitive evaluation",
        research_run_id=99,
        demo_mode=True,
    ):
        events.append(event)

    assert len(events) >= 7  # 7 nodes + 1 completion
    last_event = events[-1]
    assert last_event["event"] == "run_completed"
    final_state = last_event["final_state"]
    assert final_state["report"] is not None
    assert len(final_state["sources"]) > 0
    assert len(final_state["findings"]) > 0
