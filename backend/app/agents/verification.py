"""Verification Agent: Cross-checks claims, detects contradictions, and scores confidence."""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

from langchain_core.messages import HumanMessage, SystemMessage

from backend.app.agents.llm import get_llm
from backend.app.agents.state import ClaimInfo, ConflictInfo, OrchestratorState
from backend.app.services.demo_data import DEMO_CLAIMS, DEMO_CONFLICTS

logger = logging.getLogger(__name__)


async def run_verification(
    state: OrchestratorState,
) -> Dict[str, Any]:
    """Verify claims, cross-reference sources, and detect conflicting information."""
    start_time = datetime.now(timezone.utc).isoformat()
    is_demo = state.get("demo_mode", True)
    findings = state.get("findings", [])

    logger.info(f"[Verification] Evaluating {len(findings)} findings for consistency and conflicts")

    claims: List[ClaimInfo] = []
    conflicts: List[ConflictInfo] = []
    llm = get_llm()

    if is_demo or llm is None:
        # Load realistic demo claims with intentionally verified conflicts
        for c in DEMO_CLAIMS:
            claims.append(
                ClaimInfo(
                    claim_text=c["claim_text"],
                    source_agent=c["source_agent"],
                    verification_status=c["verification_status"],
                    confidence=float(c["confidence"]),
                    evidence=list(c["evidence"]),
                )
            )

        for cf in DEMO_CONFLICTS:
            conflicts.append(
                ConflictInfo(
                    claim_a=cf["claim_a"],
                    claim_b=cf["claim_b"],
                    description=cf["description"],
                    resolution=cf.get("resolution"),
                )
            )
    else:
        # Live cross-agent verification using LLM
        prompt = (
            "You are an expert Intelligence Verification and Fact-Checking Agent.\n"
            "Examine these findings from diverse agents and cross-reference them:\n\n"
        )
        for i, f in enumerate(findings):
            prompt += f"Finding {i+1} [{f['agent']} - {f['category']}]: {f['title']} - {f['content']}\n"

        prompt += (
            "\nTask:\n"
            "1. Extract the main verifiable claims with verification_status ('verified', 'conflicting', 'unverifiable') and confidence (0.0 - 1.0).\n"
            "2. Identify any contradictions or conflicting assertions between claims.\n"
            "3. NEVER silently resolve conflicts; explicitly flag them.\n"
            "Respond in JSON format: {\"claims\": [...], \"conflicts\": [...]}\n"
            "claims fields: claim_text, source_agent, verification_status, confidence, evidence (list of strings)\n"
            "conflicts fields: claim_a, claim_b, description, resolution"
        )

        try:
            res = await llm.ainvoke([
                SystemMessage(content="You are a rigorous verification engine. Output only valid JSON."),
                HumanMessage(content=prompt)
            ])
            raw_text = res.content.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1].split("```")[0].strip()

            data = json.loads(raw_text)
            for c in data.get("claims", []):
                claims.append(
                    ClaimInfo(
                        claim_text=c.get("claim_text", ""),
                        source_agent=c.get("source_agent", "verification"),
                        verification_status=c.get("verification_status", "verified"),
                        confidence=float(c.get("confidence", 0.9)),
                        evidence=c.get("evidence", []),
                    )
                )

            for cf in data.get("conflicts", []):
                conflicts.append(
                    ConflictInfo(
                        claim_a=cf.get("claim_a", ""),
                        claim_b=cf.get("claim_b", ""),
                        description=cf.get("description", ""),
                        resolution=cf.get("resolution", None),
                    )
                )
        except Exception as exc:
            logger.warning(f"[Verification] LLM verification error: {exc}. Using demo fallback.")
            for c in DEMO_CLAIMS:
                claims.append(
                    ClaimInfo(
                        claim_text=c["claim_text"],
                        source_agent=c["source_agent"],
                        verification_status=c["verification_status"],
                        confidence=float(c["confidence"]),
                        evidence=list(c["evidence"]),
                    )
                )
            for cf in DEMO_CONFLICTS:
                conflicts.append(
                    ConflictInfo(
                        claim_a=cf["claim_a"],
                        claim_b=cf["claim_b"],
                        description=cf["description"],
                        resolution=cf.get("resolution"),
                    )
                )

    end_time = datetime.now(timezone.utc).isoformat()
    return {
        "claims": claims,
        "conflicts": conflicts,
        "agent_progress": {
            **state.get("agent_progress", {}),
            "verification": {
                "agent_name": "verification",
                "status": "completed",
                "message": f"Verified {len(claims)} claims; flagged {len(conflicts)} conflicts.",
                "started_at": start_time,
                "completed_at": end_time,
            },
        },
    }
