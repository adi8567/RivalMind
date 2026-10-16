"""Product & Pricing Agent: Analyzes feature roadmaps, tiers, and packaging."""

import json
import logging
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


async def run_product_pricing(
    state: OrchestratorState,
) -> Dict[str, Any]:
    """Extract and structure product features and pricing models."""
    start_time = datetime.now(timezone.utc).isoformat()
    competitor = state.get("competitor_name", "Target Competitor")
    is_demo = state.get("demo_mode", True)

    logger.info(f"[ProductPricing] Analyzing product & pricing intelligence for {competitor}")

    findings: List[FindingInfo] = list(state.get("findings", []))
    product_intel: List[Dict[str, Any]] = list(state.get("product_intel", []))
    pricing_intel: List[Dict[str, Any]] = list(state.get("pricing_intel", []))
    llm = get_llm()

    if is_demo or llm is None:
        # Load demo product and pricing datasets
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
        # Extract from accumulated web findings using LLM
        context_text = "\n".join([f"{f['title']}: {f['content']}" for f in findings])
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
                    "product_name": p.get("name", "Product"),
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
            logger.warning(f"[ProductPricing] LLM extraction error: {exc}. Retaining demo defaults.")
            product_intel.extend(DEMO_PRODUCT_INTEL)
            pricing_intel.extend(DEMO_PRICING_INTEL)

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
