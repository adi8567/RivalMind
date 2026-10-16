"""Planner Agent: Breaks down competitive query into structured tasks."""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

from langchain_core.messages import HumanMessage, SystemMessage

from backend.app.agents.llm import get_llm
from backend.app.agents.state import OrchestratorState, ResearchTask
from backend.app.services.demo_data import DEMO_RESEARCH_TASKS

logger = logging.getLogger(__name__)


async def plan_research_tasks(
    state: OrchestratorState,
) -> Dict[str, Any]:
    """Analyze query and competitor to produce a coordinated research task plan."""
    start_time = datetime.now(timezone.utc).isoformat()
    competitor = state.get("competitor_name", "Competitor")
    query = state.get("query", "Comprehensive competitive intelligence analysis")
    is_demo = state.get("demo_mode", True)

    logger.info(f"[Planner] Planning research tasks for {competitor}: '{query}'")

    tasks: List[ResearchTask] = []
    llm = get_llm()

    if is_demo or llm is None:
        # Predefined structured tasks based on query/competitor
        tasks = [
            ResearchTask(
                task_id=f"task-web-{i+1}",
                description=t["description"].replace("Microsoft", competitor),
                agent=t["agent"],
                status="pending",
                priority=t["priority"],
            )
            for i, t in enumerate(DEMO_RESEARCH_TASKS)
        ]
    else:
        # Use LLM for dynamic task decomposition
        prompt = (
            f"You are the Lead Strategic Planner for a Competitive Intelligence system.\n"
            f"Competitor: {competitor}\n"
            f"Research Question: {query}\n\n"
            f"Decompose this research request into specific tasks assigned to these agents:\n"
            f"- web_research (extracting official sites, features, announcements)\n"
            f"- news (identifying recent press coverage, partnerships, sentiment)\n"
            f"- product_pricing (identifying pricing tiers, packaging, discounts)\n"
            f"- financial_rag (extracting revenue, margins, public filings disclosures)\n"
            f"- verification (checking factual consistency and detecting conflicts)\n"
            f"- synthesis (compiling executive intelligence report)\n\n"
            f"Respond with a JSON array of objects with keys: task_id, description, agent, status, priority (1-5)."
        )

        try:
            messages = [
                SystemMessage(
                    content="You are an expert research planner. Output only valid JSON arrays."
                ),
                HumanMessage(content=prompt),
            ]
            response = await llm.ainvoke(messages)
            raw_text = response.content.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1].split("```")[0].strip()

            parsed = json.loads(raw_text)
            for item in parsed:
                tasks.append(
                    ResearchTask(
                        task_id=str(item.get("task_id", f"task-{len(tasks)+1}")),
                        description=str(item.get("description", "")),
                        agent=str(item.get("agent", "web_research")),
                        status="pending",
                        priority=int(item.get("priority", 1)),
                    )
                )
        except Exception as exc:
            logger.warning(
                f"[Planner] LLM decomposition failed ({exc}), falling back to standard plan."
            )
            tasks = [
                ResearchTask(
                    task_id=f"task-{i+1}",
                    description=t["description"].replace("Microsoft", competitor),
                    agent=t["agent"],
                    status="pending",
                    priority=t["priority"],
                )
                for i, t in enumerate(DEMO_RESEARCH_TASKS)
            ]

    end_time = datetime.now(timezone.utc).isoformat()
    return {
        "research_tasks": tasks,
        "agent_progress": {
            **state.get("agent_progress", {}),
            "planner": {
                "agent_name": "planner",
                "status": "completed",
                "message": f"Successfully planned {len(tasks)} tasks.",
                "started_at": start_time,
                "completed_at": end_time,
            },
        },
    }
