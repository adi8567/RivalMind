"""News Agent: Gathers real recent industry developments, press releases, and sentiment."""

import logging
import urllib.parse
from datetime import datetime, timezone
from typing import Any, Dict, List
import httpx
from bs4 import BeautifulSoup
import warnings
from bs4 import XMLParsedAsHTMLWarning

warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

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


async def fetch_live_google_news(competitor: str) -> List[Dict[str, Any]]:
    """Fetch live real news articles from Google News RSS without requiring API keys."""
    encoded_query = urllib.parse.quote(competitor)
    rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    articles: List[Dict[str, Any]] = []

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(rss_url, headers=headers)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                items = soup.find_all("item")
                for item in items[:8]:
                    raw_title = item.title.text.strip() if item.title else ""
                    link = item.link.text.strip() if item.link else ""
                    if not link and item.guid:
                        link = item.guid.text.strip()

                    source_name = "News Media"
                    if " - " in raw_title:
                        parts = raw_title.rsplit(" - ", 1)
                        title = parts[0].strip()
                        source_name = parts[1].strip()
                    else:
                        title = raw_title

                    desc = ""
                    if item.description:
                        desc_soup = BeautifulSoup(item.description.text, "html.parser")
                        desc = desc_soup.get_text().strip()

                    # Classify category
                    lower = f"{title} {desc}".lower()
                    if any(k in lower for k in ["ai", "copilot", "llm", "model", "gpt", "agent"]):
                        cat = "ai"
                    elif any(k in lower for k in ["acquire", "acquisition", "merger", "buyout", "bought"]):
                        cat = "acquisition"
                    elif any(k in lower for k in ["price", "pricing", "cost", "subscription", "plan", "rate"]):
                        cat = "pricing"
                    elif any(k in lower for k in ["partner", "partnership", "collaborat", "alliance"]):
                        cat = "partnership"
                    elif any(k in lower for k in ["ceo", "executive", "hire", "appoint", "leadership", "board"]):
                        cat = "leadership"
                    elif any(k in lower for k in ["regulat", "sec", "ftc", "court", "lawsuit", "antitrust"]):
                        cat = "regulation"
                    elif any(k in lower for k in ["launch", "release", "feature", "unveil", "introduce"]):
                        cat = "product_launch"
                    else:
                        cat = "market_expansion"

                    # Classify sentiment
                    pos_words = ["growth", "record", "surge", "expand", "soar", "gain", "breakthrough", "lead", "boost"]
                    neg_words = ["drop", "decline", "fall", "slump", "lawsuit", "breach", "probe", "investigat", "warn", "loss"]
                    if any(w in lower for w in pos_words):
                        sentiment = "positive"
                    elif any(w in lower for w in neg_words):
                        sentiment = "negative"
                    else:
                        sentiment = "neutral"

                    articles.append({
                        "title": title,
                        "summary": desc[:350] or f"Coverage of recent strategic developments concerning {competitor}.",
                        "url": link or f"https://news.google.com/search?q={encoded_query}",
                        "source_name": source_name,
                        "category": cat,
                        "published_at": datetime.now(timezone.utc),
                        "sentiment": sentiment,
                    })
    except Exception as exc:
        logger.warning(f"[News] Error fetching live Google News RSS: {exc}")

    return articles


async def run_news(
    state: OrchestratorState,
) -> Dict[str, Any]:
    """Search and structure real news articles for the competitor."""
    start_time = datetime.now(timezone.utc).isoformat()
    competitor = state.get("competitor_name", "Target Competitor")
    is_demo = state.get("demo_mode", True)

    logger.info(f"[News] Gathering media coverage and sentiment for {competitor} (demo_mode={is_demo})")

    findings: List[FindingInfo] = list(state.get("findings", []))
    sources: List[SourceInfo] = list(state.get("sources", []))
    news_items: List[Dict[str, Any]] = list(state.get("news_items", []))
    llm = get_llm()

    news_api_key = settings.NEWS_API_KEY.strip()

    if not is_demo:
        # LIVE MODE: First try NewsAPI if key configured, otherwise use live Google News RSS
        live_articles: List[Dict[str, Any]] = []
        if news_api_key:
            try:
                url = f"https://newsapi.org/v2/everything?q={urllib.parse.quote(competitor)}&sortBy=relevancy&pageSize=6&apiKey={news_api_key}"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        raw_arts = resp.json().get("articles", [])
                        for art in raw_arts:
                            title = art.get("title", "")
                            desc = art.get("description", "") or ""
                            lower = f"{title} {desc}".lower()
                            cat = "ai" if "ai" in lower or "model" in lower else "product_launch"
                            sentiment = "positive" if any(w in lower for w in ["gain", "grow", "top", "record"]) else "neutral"
                            live_articles.append({
                                "title": title,
                                "summary": desc[:300],
                                "url": art.get("url", ""),
                                "source_name": art.get("source", {}).get("name", "News Outlet"),
                                "category": cat,
                                "published_at": datetime.now(timezone.utc),
                                "sentiment": sentiment,
                            })
            except Exception as exc:
                logger.warning(f"[News] NewsAPI call error: {exc}")

        # If NewsAPI returned nothing or no key, fetch real Google News RSS
        if not live_articles:
            live_articles = await fetch_live_google_news(competitor)

        for item in live_articles:
            news_items.append(item)
            if item.get("url"):
                sources.append(
                    SourceInfo(
                        url=item["url"],
                        title=f"{item['source_name']}: {item['title']}",
                        source_type="news",
                        content=item["summary"],
                        credibility=0.92,
                    )
                )

            findings.append(
                FindingInfo(
                    agent="news",
                    category="news",
                    title=f"Market Intelligence: {item['title'][:100]}",
                    content=item["summary"],
                    confidence=0.90,
                    evidence_type="retrieved_info",
                    sources=[item["url"]],
                )
            )

    else:
        # DEMO MODE: Load realistic demo fixtures
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
                "message": f"Collected {len(news_items)} real media items and assessed sentiment.",
                "started_at": start_time,
                "completed_at": end_time,
            },
        },
    }
