"""Main LangGraph orchestrator wiring the multi-agent intelligence pipeline."""

import logging
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Awaitable, Callable, Dict, List, Optional

from langgraph.graph import END, START, StateGraph

from backend.app.agents.financial_rag import run_financial_rag
from backend.app.agents.news import run_news
from backend.app.agents.planner import plan_research_tasks
from backend.app.agents.product_pricing import run_product_pricing
from backend.app.agents.state import OrchestratorState
from backend.app.agents.synthesis import run_synthesis
from backend.app.agents.verification import run_verification
from backend.app.agents.web_research import run_web_research

logger = logging.getLogger(__name__)


# Node wrappers with comprehensive error handling
async def node_planner(state: OrchestratorState) -> Dict[str, Any]:
    """Execute the Planner Agent."""
    try:
        return await plan_research_tasks(state)
    except Exception as exc:
        logger.error(f"[Orchestrator] Error in planner node: {exc}", exc_info=True)
        errors = list(state.get("errors", [])) + [f"planner: {str(exc)}"]
        return {
            "errors": errors,
            "agent_progress": {
                **state.get("agent_progress", {}),
                "planner": {
                    "agent_name": "planner",
                    "status": "failed",
                    "message": str(exc),
                    "started_at": datetime.now(timezone.utc).isoformat(),
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                },
            },
        }


async def node_web_research(state: OrchestratorState) -> Dict[str, Any]:
    """Execute the Web Research Agent."""
    try:
        return await run_web_research(state)
    except Exception as exc:
        logger.error(f"[Orchestrator] Error in web_research node: {exc}", exc_info=True)
        errors = list(state.get("errors", [])) + [f"web_research: {str(exc)}"]
        return {
            "errors": errors,
            "agent_progress": {
                **state.get("agent_progress", {}),
                "web_research": {
                    "agent_name": "web_research",
                    "status": "failed",
                    "message": str(exc),
                    "started_at": datetime.now(timezone.utc).isoformat(),
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                },
            },
        }


async def node_news(state: OrchestratorState) -> Dict[str, Any]:
    """Execute the News Agent."""
    try:
        return await run_news(state)
    except Exception as exc:
        logger.error(f"[Orchestrator] Error in news node: {exc}", exc_info=True)
        errors = list(state.get("errors", [])) + [f"news: {str(exc)}"]
        return {
            "errors": errors,
            "agent_progress": {
                **state.get("agent_progress", {}),
                "news": {
                    "agent_name": "news",
                    "status": "failed",
                    "message": str(exc),
                    "started_at": datetime.now(timezone.utc).isoformat(),
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                },
            },
        }


async def node_product_pricing(state: OrchestratorState) -> Dict[str, Any]:
    """Execute the Product & Pricing Agent."""
    try:
        return await run_product_pricing(state)
    except Exception as exc:
        logger.error(f"[Orchestrator] Error in product_pricing node: {exc}", exc_info=True)
        errors = list(state.get("errors", [])) + [f"product_pricing: {str(exc)}"]
        return {
            "errors": errors,
            "agent_progress": {
                **state.get("agent_progress", {}),
                "product_pricing": {
                    "agent_name": "product_pricing",
                    "status": "failed",
                    "message": str(exc),
                    "started_at": datetime.now(timezone.utc).isoformat(),
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                },
            },
        }


async def node_financial_rag(state: OrchestratorState) -> Dict[str, Any]:
    """Execute the Financial Intelligence Agent."""
    try:
        return await run_financial_rag(state)
    except Exception as exc:
        logger.error(f"[Orchestrator] Error in financial_rag node: {exc}", exc_info=True)
        errors = list(state.get("errors", [])) + [f"financial_rag: {str(exc)}"]
        return {
            "errors": errors,
            "agent_progress": {
                **state.get("agent_progress", {}),
                "financial_rag": {
                    "agent_name": "financial_rag",
                    "status": "failed",
                    "message": str(exc),
                    "started_at": datetime.now(timezone.utc).isoformat(),
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                },
            },
        }


async def node_verification(state: OrchestratorState) -> Dict[str, Any]:
    """Execute the Verification Agent."""
    try:
        return await run_verification(state)
    except Exception as exc:
        logger.error(f"[Orchestrator] Error in verification node: {exc}", exc_info=True)
        errors = list(state.get("errors", [])) + [f"verification: {str(exc)}"]
        return {
            "errors": errors,
            "agent_progress": {
                **state.get("agent_progress", {}),
                "verification": {
                    "agent_name": "verification",
                    "status": "failed",
                    "message": str(exc),
                    "started_at": datetime.now(timezone.utc).isoformat(),
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                },
            },
        }


async def node_synthesis(state: OrchestratorState) -> Dict[str, Any]:
    """Execute the Synthesis Agent."""
    try:
        return await run_synthesis(state)
    except Exception as exc:
        logger.error(f"[Orchestrator] Error in synthesis node: {exc}", exc_info=True)
        errors = list(state.get("errors", [])) + [f"synthesis: {str(exc)}"]
        return {
            "errors": errors,
            "agent_progress": {
                **state.get("agent_progress", {}),
                "synthesis": {
                    "agent_name": "synthesis",
                    "status": "failed",
                    "message": str(exc),
                    "started_at": datetime.now(timezone.utc).isoformat(),
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                },
            },
        }


def create_orchestrator_graph() -> Any:
    """Build and compile the LangGraph workflow graph."""
    graph = StateGraph(OrchestratorState)

    # Register nodes
    graph.add_node("planner", node_planner)
    graph.add_node("web_research", node_web_research)
    graph.add_node("news", node_news)
    graph.add_node("product_pricing", node_product_pricing)
    graph.add_node("financial_rag", node_financial_rag)
    graph.add_node("verification", node_verification)
    graph.add_node("synthesis", node_synthesis)

    # Define sequential edges: planner -> [web_research, news] -> product_pricing -> financial_rag -> verification -> synthesis
    graph.add_edge(START, "planner")
    graph.add_edge("planner", "web_research")
    graph.add_edge("web_research", "news")
    graph.add_edge("news", "product_pricing")
    graph.add_edge("product_pricing", "financial_rag")
    graph.add_edge("financial_rag", "verification")
    graph.add_edge("verification", "synthesis")
    graph.add_edge("synthesis", END)

    return graph.compile()


orchestrator_app = create_orchestrator_graph()


async def run_orchestrator(
    competitor_name: str,
    competitor_urls: List[str],
    query: str,
    research_run_id: int,
    demo_mode: bool = True,
    on_step_callback: Optional[
        Callable[[str, Dict[str, Any], OrchestratorState], Awaitable[None]]
    ] = None,
) -> AsyncGenerator[Dict[str, Any], None]:
    """Execute the multi-agent graph and yield step-by-step progress events.

    Args:
        competitor_name: Name of competitor.
        competitor_urls: URLs to analyze.
        query: User research question.
        research_run_id: DB ID for the research run.
        demo_mode: True to use simulated data fixtures.
        on_step_callback: Optional hook called after each agent completes.

    Yields:
        Dictionary reporting agent status, progress message, and accumulated state.
    """
    initial_state: OrchestratorState = {
        "competitor_name": competitor_name,
        "competitor_urls": competitor_urls,
        "query": query,
        "research_run_id": research_run_id,
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
        "demo_mode": demo_mode,
    }

    current_state: OrchestratorState = dict(initial_state)

    logger.info(
        f"[Orchestrator] Commencing pipeline execution for Run ID {research_run_id} (Demo={demo_mode})"
    )

    async for step_output in orchestrator_app.astream(initial_state):
        for node_name, updates in step_output.items():
            # Update local accumulator
            for key, val in updates.items():
                if key == "agent_progress":
                    current_state["agent_progress"].update(val)
                elif isinstance(val, list) and key in current_state and isinstance(current_state[key], list):
                    current_state[key] = val
                else:
                    current_state[key] = val

            progress_info = current_state["agent_progress"].get(
                node_name,
                {
                    "agent_name": node_name,
                    "status": "completed",
                    "message": f"{node_name} completed.",
                },
            )

            # Fire callback if registered
            if on_step_callback:
                try:
                    await on_step_callback(node_name, updates, current_state)
                except Exception as cb_exc:
                    logger.warning(f"[Orchestrator] Progress callback exception: {cb_exc}")

            yield {
                "event": "agent_progress",
                "agent": node_name,
                "status": progress_info.get("status", "completed"),
                "message": progress_info.get("message", f"{node_name} execution step finished."),
                "started_at": progress_info.get("started_at"),
                "completed_at": progress_info.get("completed_at"),
                "research_run_id": research_run_id,
                "data_summary": {
                    "sources_count": len(current_state.get("sources", [])),
                    "findings_count": len(current_state.get("findings", [])),
                    "claims_count": len(current_state.get("claims", [])),
                    "conflicts_count": len(current_state.get("conflicts", [])),
                    "has_report": current_state.get("report") is not None,
                },
            }

    yield {
        "event": "run_completed",
        "research_run_id": research_run_id,
        "final_state": current_state,
    }
