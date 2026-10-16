"""Web Research Agent: Gathers intelligence from competitor web domains."""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List
import httpx
from bs4 import BeautifulSoup

from backend.app.agents.llm import get_llm
from backend.app.agents.state import FindingInfo, OrchestratorState, SourceInfo
from backend.app.services.demo_data import DEMO_FINDINGS, DEMO_SOURCES

logger = logging.getLogger(__name__)


async def fetch_page_content(url: str, client: httpx.AsyncClient) -> Dict[str, str]:
    """Safely fetch and parse HTML content with timeout protection."""
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

        # Strip scripts and styles
        for tag in soup(["script", "style", "noscript", "svg"]):
            tag.decompose()

        title = soup.title.string.strip() if soup.title and soup.title.string else url
        body_text = " ".join(soup.stripped_strings)[:2000]

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
            "content": f"Failed to retrieve {url}: {str(exc)}",
            "status": "failed",
        }


async def run_web_research(
    state: OrchestratorState,
) -> Dict[str, Any]:
    """Execute web research for target competitor."""
    start_time = datetime.now(timezone.utc).isoformat()
    competitor = state.get("competitor_name", "Target Competitor")
    urls = state.get("competitor_urls", [])
    is_demo = state.get("demo_mode", True)

    logger.info(f"[WebResearch] Starting research for {competitor} across {len(urls)} URLs")

    sources: List[SourceInfo] = list(state.get("sources", []))
    findings: List[FindingInfo] = list(state.get("findings", []))
    llm = get_llm()

    if is_demo or not urls:
        # Load realistic demo sources and findings
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
        # Live scraping mode
        async with httpx.AsyncClient(follow_redirects=True) as client:
            for url in urls[:5]:
                page_data = await fetch_page_content(url, client)
                if page_data["status"] == "success" and page_data["content"]:
                    sources.append(
                        SourceInfo(
                            url=page_data["url"],
                            title=page_data["title"],
                            source_type="website",
                            content=page_data["content"][:600],
                            credibility=0.9,
                        )
                    )

                    # Create finding from page content
                    finding_summary = page_data["content"][:350]
                    if llm:
                        try:
                            from langchain_core.messages import HumanMessage, SystemMessage

                            prompt = (
                                f"Extract key product features, offerings, and updates for competitor '{competitor}' "
                                f"from this text:\n\n{page_data['content']}"
                            )
                            res = await llm.ainvoke([
                                SystemMessage(content="You are a competitive intelligence analyst. Be concise."),
                                HumanMessage(content=prompt)
                            ])
                            finding_summary = res.content.strip()
                        except Exception as exc:
                            logger.debug(f"[WebResearch] LLM summarization fallback: {exc}")

                    findings.append(
                        FindingInfo(
                            agent="web_research",
                            category="product",
                            title=f"Web Intelligence: {page_data['title'][:100]}",
                            content=finding_summary,
                            confidence=0.88,
                            evidence_type="retrieved_info",
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
                "message": f"Retrieved {len(sources)} sources and {len(findings)} findings.",
                "started_at": start_time,
                "completed_at": end_time,
            },
        },
    }
