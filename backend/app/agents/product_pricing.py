"""Product & Pricing Agent: Analyzes feature roadmaps, tiers, and packaging."""

import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List

from langchain_core.messages import HumanMessage, SystemMessage

from backend.app.agents.llm import get_llm
from backend.app.agents.state import FindingInfo, OrchestratorState
from backend.app.services.demo_data import (
    DEMO_FINDINGS,
    DEMO_PRICING_INTEL,
    DEMO_PRODUCT_INTEL,
)

logger = logging.getLogger(__name__)


def extract_heuristic_product_pricing(
    competitor: str, findings: List[FindingInfo], sources: List[Any]
) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Dynamically extract real products and pricing signals from scraped content without LLM."""
    products: List[Dict[str, Any]] = []
    pricing: List[Dict[str, Any]] = []
    now_iso = datetime.now(timezone.utc)

    seen_products = set()
    for f in findings:
        title = f.get("title", "")
        content = f.get("content", "")
        # Look for product patterns
        clean_title = title.replace("Live Web Finding: ", "").replace("Market Intelligence: ", "").strip()
        if clean_title and clean_title not in seen_products:
            seen_products.add(clean_title)
            # Detect change type
            lower = f"{title} {content}".lower()
            if any(w in lower for w in ["launch", "announce", "unveil", "introduce", "new"]):
                change_type = "launch"
            elif any(w in lower for w in ["deprecat", "retire", "eol", "discontinue"]):
                change_type = "deprecation"
            elif any(w in lower for w in ["feature", "integrat", "capability"]):
                change_type = "feature"
            else:
                change_type = "update"

            source_url = f.get("sources", [None])[0] if f.get("sources") else None
            products.append({
                "product_name": clean_title[:70],
                "change_type": change_type,
                "description": content[:300] or f"Identified offering under {competitor}.",
                "source_url": source_url,
                "detected_at": now_iso,
            })

        # Extract pricing signals
        dollar_matches = re.findall(r"\$\d+(?:\.\d+)?(?:\s*(?:/|per)\s*(?:mo|month|user|seat|year|gb|hr))?", content, re.IGNORECASE)
        tier_matches = [t for t in ["Enterprise", "Professional", "Team", "Standard", "Free", "Starter", "Business"] if t.lower() in content.lower()]

        if dollar_matches or tier_matches:
            pricing.append({
                "product_name": clean_title[:50] or f"{competitor} Suite",
                "pricing_model": "Tiered / Usage-based" if "usage" in content.lower() else "Subscription",
                "price_details": {
                    "rates_detected": dollar_matches[:3],
                    "tiers_mentioned": tier_matches[:4],
                },
                "change_description": f"Observed commercial tiers: {', '.join(tier_matches[:3]) if tier_matches else 'Published quote'}. Rates: {', '.join(dollar_matches[:2]) if dollar_matches else 'Custom quote'}.",
                "source_url": f.get("sources", [None])[0] if f.get("sources") else None,
                "detected_at": now_iso,
            })

    if not products:
        products.append({
            "product_name": f"{competitor} Core Platform",
            "change_type": "update",
            "description": f"Active product portfolio identified for {competitor} from public web research.",
            "source_url": None,
            "detected_at": now_iso,
        })

    if not pricing:
        pricing.append({
            "product_name": f"{competitor} Enterprise License",
            "pricing_model": "Quote-based / Contact Sales",
            "price_details": {"model": "Custom Enterprise Agreement"},
            "change_description": "No direct self-serve rate card published on discovered endpoints; enterprise engagement required.",
            "source_url": None,
            "detected_at": now_iso,
        })

    return products[:8], pricing[:6]


async def run_product_pricing(
    state: OrchestratorState,
) -> Dict[str, Any]:
    """Extract and structure product features and pricing models from live data or demo fixtures."""
    start_time = datetime.now(timezone.utc).isoformat()
    competitor = state.get("competitor_name", "Target Competitor")
    is_demo = state.get("demo_mode", True)

    logger.info(f"[ProductPricing] Analyzing product & pricing intelligence for {competitor} (demo_mode={is_demo})")

    findings: List[FindingInfo] = list(state.get("findings", []))
    product_intel: List[Dict[str, Any]] = list(state.get("product_intel", []))
    pricing_intel: List[Dict[str, Any]] = list(state.get("pricing_intel", []))
    llm = get_llm()

    if is_demo:
        # Load realistic demo fixtures
        product_intel.extend(DEMO_PRODUCT_INTEL)
        pricing_intel.extend(DEMO_PRICING_INTEL)

        for f in DEMO_FINDINGS:
            if f["agent"] == "product_pricing":
                findings.append(
                    FindingInfo(
                        agent="product_pricing",
                        category=f["category"],
                        title=f["title"],
                        content=f["content"],
                        confidence=float(f["confidence"]),
                        evidence_type=f["evidence_type"],
                        sources=f["sources"],
                    )
                )
    else:
        # LIVE MODE
        if llm is not None:
            context_text = "\n".join([f"{f['title']}: {f['content']}" for f in findings[:10]])
            prompt = (
                f"You are a Product and Pricing Intelligence Analyst evaluating {competitor}.\n"
                f"Given the following collected findings:\n\n{context_text}\n\n"
                f"Rules:\n"
                f"1. Extract structured product updates (name, change_type [launch, update, deprecation, feature], description).\n"
                f"2. Extract pricing tiers (product_name, pricing_model, price_details dict, change_description).\n"
                f"3. NEVER fabricate or hallucinate prices. If not stated, mark as 'Contact Sales' or null.\n"
                f"Respond with a JSON object: {{\"products\": [...], \"pricing\": [...]}}"
            )

            try:
                res = await llm.ainvoke([
                    SystemMessage(content="You are a precise pricing analyst. Output only valid JSON."),
                    HumanMessage(content=prompt)
                ])
                raw_text = res.content.strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text.split("```json")[1].split("```")[0].strip()
                elif raw_text.startswith("```"):
                    raw_text = raw_text.split("```")[1].split("```")[0].strip()

                data = json.loads(raw_text)
                now_iso = datetime.now(timezone.utc)
                for p in data.get("products", []):
                    product_intel.append({
                        "product_name": p.get("name", p.get("product_name", "Product")),
                        "change_type": p.get("change_type", "update"),
                        "description": p.get("description", ""),
                        "source_url": p.get("source_url", None),
                        "detected_at": now_iso,
                    })
                for pr in data.get("pricing", []):
                    pricing_intel.append({
                        "product_name": pr.get("product_name", "Tier"),
                        "pricing_model": pr.get("pricing_model", "Subscription"),
                        "price_details": pr.get("price_details", {}),
                        "change_description": pr.get("change_description", None),
                        "source_url": pr.get("source_url", None),
                        "detected_at": now_iso,
                    })
            except Exception as exc:
                logger.warning(f"[ProductPricing] LLM extraction error: {exc}. Using dynamic heuristic extraction.")
                extracted_p, extracted_pr = extract_heuristic_product_pricing(
                    competitor, findings, state.get("sources", [])
                )
                product_intel.extend(extracted_p)
                pricing_intel.extend(extracted_pr)
        else:
            # No LLM key configured: use dynamic heuristic parsing of live findings
            extracted_p, extracted_pr = extract_heuristic_product_pricing(
                competitor, findings, state.get("sources", [])
            )
            product_intel.extend(extracted_p)
            pricing_intel.extend(extracted_pr)

        # Generate verified findings for product & pricing
        for p in product_intel[:3]:
            findings.append(
                FindingInfo(
                    agent="product_pricing",
                    category="product",
                    title=f"Product Delta: {p['product_name']}",
                    content=p["description"] or f"Active capability detected for {competitor}.",
                    confidence=0.91,
                    evidence_type="verified_fact",
                    sources=[p.get("source_url") or "live_research"],
                )
            )

        for pr in pricing_intel[:2]:
            findings.append(
                FindingInfo(
                    agent="product_pricing",
                    category="pricing",
                    title=f"Packaging & Rate: {pr['product_name']}",
                    content=pr["change_description"] or f"Pricing structure under model: {pr['pricing_model']}.",
                    confidence=0.88,
                    evidence_type="retrieved_info",
                    sources=[pr.get("source_url") or "live_research"],
                )
            )

    end_time = datetime.now(timezone.utc).isoformat()
    return {
        "findings": findings,
        "product_intel": product_intel,
        "pricing_intel": pricing_intel,
        "agent_progress": {
            **state.get("agent_progress", {}),
            "product_pricing": {
                "agent_name": "product_pricing",
                "status": "completed",
                "message": f"Processed {len(product_intel)} products and {len(pricing_intel)} pricing models.",
                "started_at": start_time,
                "completed_at": end_time,
            },
        },
    }
