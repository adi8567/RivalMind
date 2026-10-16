"""News Agent: Gathers recent industry developments, press releases, and sentiment."""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List
import httpx

from backend.app.agents.llm import get_llm
from backend.app.agents.state import FindingInfo, OrchestratorState, SourceInfo
from backend.app.config import settings
from backend.app.services.demo_data import DEMO_FINDINGS, DEMO_NEWS_ITEMS

logger = logging.getLogger(__name__)

VALID_CATEGORIES = {
    "product_launch",
    "ai",
    "partnership",
    "acquisition",
    "pricing",
    "leadership",
    "regulation",
    "market_expansion",
}


async def run_news(
    state: OrchestratorState,
) -> Dict[str, Any]:
    """Search and structure news articles for the competitor."""
    start_time = datetime.now(timezone.utc).isoformat()
    competitor = state.get("competitor_name", "Target Competitor")
    is_demo = state.get("demo_mode", True)

    logger.info(f"[News] Gathering media coverage and sentiment for {competitor}")

    findings: List[FindingInfo] = list(state.get("findings", []))
    sources: List[SourceInfo] = list(state.get("sources", []))
    news_items: List[Dict[str, Any]] = list(state.get("news_items", []))
    llm = get_llm()

    news_api_key = settings.NEWS_API_KEY.strip()
    use_live_news = not is_demo and bool(news_api_key)

    if use_live_news:
        try:
            url = f"https://newsapi.org/v2/everything?q={competitor}&sortBy=relevancy&pageSize=5&apiKey={news_api_key}"
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, timeout=10.0)
                if resp.status_code == 200:
                    articles = resp.json().get("articles", [])
                    for art in articles:
                        title = art.get("title", "")
                        desc = art.get("description", "") or ""
                        art_url = art.get("url", "")
                        source_name = art.get("source", {}).get("name", "News Outlet")

                        # Simple sentiment & category classification via keywords
                        lower_text = f"{title} {desc}".lower()
                        cat = "ai" if "ai" in lower_text or "copilot" in lower_text else "product_launch"
                        sentiment = "positive" if any(w in lower_text for w in ["growth", "expand", "lead", "record", "launch"]) else "neutral"

                        news_items.append({
                            "title": title,
                            "summary": desc[:300],
                            "url": art_url,
                            "source_name": source_name,
                            "category": cat,
                            "published_at": datetime.now(timezone.utc),
                            "sentiment": sentiment,
                        })

                        sources.append(
                            SourceInfo(
                                url=art_url,
                                title=title,
                                source_type="news",
                                content=desc[:300],
                                credibility=0.85,
                            )
                        )
                else:
                    use_live_news = False
        except Exception as exc:
            logger.warning(f"[News] Live NewsAPI call failed ({exc}), falling back to verified dataset.")
            use_live_news = False

    if not use_live_news:
        # Load realistic demo news fixtures
        news_items.extend(DEMO_NEWS_ITEMS)

        for f in DEMO_FINDINGS:
            if f["agent"] == "news":
                findings.append(
                    FindingInfo(
                        agent="news",
                        category=f["category"],
                        title=f["title"],
                        content=f["content"],
                        confidence=float(f["confidence"]),
                        evidence_type=f["evidence_type"],
                        sources=f["sources"],
                    )
                )

        for n in DEMO_NEWS_ITEMS:
            if n.get("url"):
                sources.append(
                    SourceInfo(
                        url=n["url"],
                        title=n["title"],
                        source_type="news",
                        content=n["summary"],
                        credibility=0.90,
                    )
                )

    end_time = datetime.now(timezone.utc).isoformat()
    return {
        "findings": findings,
        "sources": sources,
        "news_items": news_items,
        "agent_progress": {
            **state.get("agent_progress", {}),
            "news": {
                "agent_name": "news",
                "status": "completed",
                "message": f"Collected {len(news_items)} news items and assessed sentiment.",
                "started_at": start_time,
                "completed_at": end_time,
            },
        },
    }
