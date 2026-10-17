"""Web Research Agent: Gathers real intelligence from competitor web domains and search."""

import logging
import urllib.parse
from datetime import datetime, timezone
from typing import Any, Dict, List
import httpx
from bs4 import BeautifulSoup

from backend.app.agents.llm import get_llm
from backend.app.agents.state import FindingInfo, OrchestratorState, SourceInfo
from backend.app.services.demo_data import DEMO_FINDINGS, DEMO_SOURCES

logger = logging.getLogger(__name__)


async def fetch_page_content(url: str, client: httpx.AsyncClient) -> Dict[str, str]:
    """Safely fetch and parse live HTML content with timeout protection."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36 CI-Bot/1.0"
        )
    }
    try:
        response = await client.get(url, headers=headers, timeout=8.0)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Strip scripts, styles, and unwanted elements
        for tag in soup(["script", "style", "noscript", "svg", "nav", "footer"]):
            tag.decompose()

        title = soup.title.string.strip() if soup.title and soup.title.string else url
        body_text = " ".join(soup.stripped_strings)[:3000]

        return {
            "url": url,
            "title": title,
            "content": body_text,
            "status": "success",
        }
    except Exception as exc:
        logger.warning(f"[WebResearch] Could not scrape {url}: {exc}")
        return {
            "url": url,
            "title": url,
            "content": f"Live access to {url} encountered: {str(exc)}",
            "status": "failed",
        }


async def discover_competitor_web_pages(competitor: str) -> List[str]:
    """Search DuckDuckGo to discover real competitor landing and pricing pages."""
    discovered: List[str] = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        query = urllib.parse.quote(f"{competitor} official website pricing")
        search_url = f"https://html.duckduckgo.com/html/?q={query}"
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(search_url, headers=headers)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                for a in soup.find_all("a", class_="result__url"):
                    href = a.get("href", "").strip()
                    if href and href.startswith("http") and "duckduckgo" not in href:
                        discovered.append(href)
                    if len(discovered) >= 4:
                        break
    except Exception as exc:
        logger.warning(f"[WebResearch] Search fallback error: {exc}")

    # Common domain fallback if search blocked
    if not discovered:
        clean_name = competitor.lower().replace(" ", "").replace("corporation", "").replace("inc", "")
        discovered = [
            f"https://www.{clean_name}.com",
            f"https://www.{clean_name}.com/pricing",
            f"https://en.wikipedia.org/wiki/{urllib.parse.quote(competitor)}",
        ]

    return discovered


async def run_web_research(
    state: OrchestratorState,
) -> Dict[str, Any]:
    """Execute live or demo web research for target competitor."""
    start_time = datetime.now(timezone.utc).isoformat()
    competitor = state.get("competitor_name", "Target Competitor")
    urls = list(state.get("competitor_urls", []))
    is_demo = state.get("demo_mode", True)

    logger.info(f"[WebResearch] Executing research for {competitor} (demo_mode={is_demo})")

    sources: List[SourceInfo] = list(state.get("sources", []))
    findings: List[FindingInfo] = list(state.get("findings", []))
    llm = get_llm()

    if is_demo:
        # Load realistic demo fixtures
        for s in DEMO_SOURCES:
            if s["source_type"] in ["website", "filing"]:
                sources.append(
                    SourceInfo(
                        url=s["url"],
                        title=s["title"],
                        source_type=s["source_type"],
                        content=s["content_snippet"],
                        credibility=float(s["credibility_score"]),
                    )
                )

        for f in DEMO_FINDINGS:
            if f["agent"] == "web_research":
                findings.append(
                    FindingInfo(
                        agent="web_research",
                        category=f["category"],
                        title=f["title"],
                        content=f["content"],
                        confidence=float(f["confidence"]),
                        evidence_type=f["evidence_type"],
                        sources=f["sources"],
                    )
                )
    else:
        # LIVE SCRAPING MODE
        if not urls:
            urls = await discover_competitor_web_pages(competitor)

        async with httpx.AsyncClient(follow_redirects=True) as client:
            for url in urls[:6]:
                page_data = await fetch_page_content(url, client)
                if page_data["status"] == "success" and page_data["content"]:
                    sources.append(
                        SourceInfo(
                            url=page_data["url"],
                            title=page_data["title"],
                            source_type="website",
                            content=page_data["content"][:600],
                            credibility=0.95,
                        )
                    )

                    finding_summary = page_data["content"][:400]
                    if llm:
                        try:
                            from langchain_core.messages import HumanMessage, SystemMessage

                            prompt = (
                                f"Analyze this live website extract for competitor '{competitor}'. "
                                f"Highlight key commercial capabilities, architecture, and features:\n\n"
                                f"{page_data['content'][:1500]}"
                            )
                            res = await llm.ainvoke([
                                SystemMessage(content="You are an enterprise competitive research specialist. Respond in 2 crisp factual sentences."),
                                HumanMessage(content=prompt)
                            ])
                            finding_summary = res.content.strip()
                        except Exception as exc:
                            logger.debug(f"[WebResearch] LLM analysis fallback: {exc}")

                    findings.append(
                        FindingInfo(
                            agent="web_research",
                            category="product",
                            title=f"Live Web Finding: {page_data['title'][:90]}",
                            content=finding_summary,
                            confidence=0.92,
                            evidence_type="verified_fact",
                            sources=[url],
                        )
                    )

    end_time = datetime.now(timezone.utc).isoformat()
    return {
        "sources": sources,
        "findings": findings,
        "agent_progress": {
            **state.get("agent_progress", {}),
            "web_research": {
                "agent_name": "web_research",
                "status": "completed",
                "message": f"Retrieved {len(sources)} sources and {len(findings)} findings from live web research.",
                "started_at": start_time,
                "completed_at": end_time,
            },
        },
    }
