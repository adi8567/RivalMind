"""Research service orchestrating agent runs, persistence, and SSE progress broadcasting."""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.agents.orchestrator import run_orchestrator
from backend.app.config import settings
from backend.app.database import AsyncSessionLocal
from backend.app.models.models import ResearchRun
from backend.app.services.db_service import (
    create_research_run,
    get_competitor,
    get_research_run,
    save_claims,
    save_conflicts,
    save_findings,
    save_news_items,
    save_pricing_intel,
    save_product_intel,
    save_report,
    save_sources,
    update_research_run,
)

logger = logging.getLogger(__name__)

# Active background progress queues for SSE clients: run_id -> asyncio.Queue
ACTIVE_RUN_QUEUES: Dict[int, asyncio.Queue] = {}


async def start_research_run(
    competitor_id: int,
    query: str,
    session: AsyncSession,
) -> ResearchRun:
    """Create a new research run and spawn background agent orchestration."""
    competitor = await get_competitor(session, competitor_id)
    if not competitor:
        raise ValueError(f"Competitor with ID {competitor_id} does not exist.")

    run = await create_research_run(session, competitor_id=competitor_id, query=query)
    queue: asyncio.Queue = asyncio.Queue()
    ACTIVE_RUN_QUEUES[run.id] = queue

    # Spawn background task
    asyncio.create_task(
        _run_orchestrator_background(
            run_id=run.id,
            competitor_id=competitor.id,
            competitor_name=competitor.name,
            competitor_urls=competitor.urls or [],
            query=query,
            demo_mode=settings.DEMO_MODE,
            queue=queue,
        )
    )

    return run


async def _run_orchestrator_background(
    run_id: int,
    competitor_id: int,
    competitor_name: str,
    competitor_urls: list,
    query: str,
    demo_mode: bool,
    queue: asyncio.Queue,
) -> None:
    """Background execution coordinator that executes pipeline and saves database artifacts."""
    logger.info(f"[ResearchService] Starting background pipeline for run #{run_id}")
    async with AsyncSessionLocal() as session:
        try:
            await update_research_run(
                session,
                run_id=run_id,
                status="running",
                started_at=datetime.now(timezone.utc),
            )

            final_state: Optional[Dict[str, Any]] = None

            async for progress_event in run_orchestrator(
                competitor_name=competitor_name,
                competitor_urls=competitor_urls,
                query=query,
                research_run_id=run_id,
                demo_mode=demo_mode,
            ):
                # Broadcast progress to SSE listener
                await queue.put(progress_event)

                event_type = progress_event.get("event")
                if event_type == "agent_progress":
                    agent_name = progress_event.get("agent")
                    status = progress_event.get("status")
                    msg = progress_event.get("message")
                    await update_research_run(
                        session,
                        run_id=run_id,
                        progress={
                            agent_name: {
                                "agent_name": agent_name,
                                "status": status,
                                "message": msg,
                            }
                        },
                    )
                elif event_type == "run_completed":
                    final_state = progress_event.get("final_state")

            if final_state:
                logger.info(f"[ResearchService] Persisting intelligence results for run #{run_id}")
                # 1. Sources
                if final_state.get("sources"):
                    await save_sources(session, run_id, final_state["sources"])

                # 2. Findings
                if final_state.get("findings"):
                    await save_findings(session, run_id, final_state["findings"])

                # 3. Product intel
                if final_state.get("product_intel"):
                    await save_product_intel(
                        session, competitor_id, run_id, final_state["product_intel"]
                    )

                # 4. Pricing intel
                if final_state.get("pricing_intel"):
                    await save_pricing_intel(
                        session, competitor_id, run_id, final_state["pricing_intel"]
                    )

                # 5. News items
                if final_state.get("news_items"):
                    await save_news_items(
                        session, competitor_id, run_id, final_state["news_items"]
                    )

                # 6. Claims
                saved_claims = []
                if final_state.get("claims"):
                    saved_claims = await save_claims(
                        session, run_id, final_state["claims"]
                    )

                # 7. Conflicts
                if final_state.get("conflicts"):
                    await save_conflicts(
                        session, run_id, final_state["conflicts"], saved_claims
                    )

                # 8. Report
                if final_state.get("report"):
                    await save_report(
                        session, competitor_id, run_id, final_state["report"]
                    )

                await update_research_run(
                    session,
                    run_id=run_id,
                    status="completed",
                    completed_at=datetime.now(timezone.utc),
                )
            else:
                await update_research_run(
                    session,
                    run_id=run_id,
                    status="completed",
                    completed_at=datetime.now(timezone.utc),
                )

        except Exception as exc:
            logger.error(
                f"[ResearchService] Pipeline failed for run #{run_id}: {exc}",
                exc_info=True,
            )
            await update_research_run(
                session,
                run_id=run_id,
                status="failed",
                error=str(exc),
                completed_at=datetime.now(timezone.utc),
            )
            await queue.put({
                "event": "run_error",
                "research_run_id": run_id,
                "error": str(exc),
            })
        finally:
            # Signal end of stream
            await queue.put(None)


async def progress_stream_generator(run_id: int) -> AsyncGenerator[str, None]:
    """Stream SSE progress events for a research run."""
    queue = ACTIVE_RUN_QUEUES.get(run_id)

    # If already ended or not active, stream current DB snapshot
    if not queue:
        async with AsyncSessionLocal() as session:
            run = await get_research_run(session, run_id)
            if not run:
                yield json.dumps({"event": "error", "message": "Research run not found."})
                return

            yield json.dumps({
                "event": "status_snapshot",
                "research_run_id": run_id,
                "status": run.status,
                "progress": run.progress,
                "completed": run.status in ["completed", "failed"],
                "error": run.error,
            })
            return

    try:
        while True:
            item = await queue.get()
            if item is None:
                # Stream finished
                yield json.dumps({
                    "event": "stream_closed",
                    "research_run_id": run_id,
                    "message": "Research pipeline finished.",
                })
                break
            yield json.dumps(item)
    finally:
        # Cleanup queue once subscriber disconnects or completes
        if queue.empty() and run_id in ACTIVE_RUN_QUEUES:
            ACTIVE_RUN_QUEUES.pop(run_id, None)
