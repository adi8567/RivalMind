"""Synthesis Agent: Compiles verified intelligence into structured executive reports."""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict

from langchain_core.messages import HumanMessage, SystemMessage

from backend.app.agents.llm import get_llm
from backend.app.agents.state import OrchestratorState
from backend.app.services.demo_data import DEMO_REPORT

logger = logging.getLogger(__name__)


async def run_synthesis(
    state: OrchestratorState,
) -> Dict[str, Any]:
    """Compile verified findings and claims into an executive briefing report."""
    start_time = datetime.now(timezone.utc).isoformat()
    competitor = state.get("competitor_name", "Target Competitor")
    is_demo = state.get("demo_mode", True)

    logger.info(f"[Synthesis] Generating executive report for {competitor}")

    llm = get_llm()
    report: Dict[str, Any] = {}

    if is_demo or llm is None:
        report = dict(DEMO_REPORT)
        report["title"] = f"[DEMO] Executive Competitive Intelligence Briefing: {competitor}"
    else:
        findings = state.get("findings", [])
        claims = state.get("claims", [])
        conflicts = state.get("conflicts", [])
        sources = state.get("sources", [])

        summary_findings = "\n".join([f"- [{f['category'].upper()}] {f['title']}: {f['content']}" for f in findings[:15]])
        summary_claims = "\n".join([f"- {c['claim_text']} (Status: {c['verification_status']}, Conf: {c['confidence']})" for c in claims[:10]])

        prompt = (
            f"You are the Chief Intelligence Officer compiling a strategic briefing for {competitor}.\n\n"
            f"Findings Context:\n{summary_findings}\n\n"
            f"Verified Claims & Conflicts:\n{summary_claims}\n\n"
            f"Instructions:\n"
            f"Synthesize this intelligence into a structured executive report.\n"
            f"Sections required:\n"
            f"1. Executive Summary\n"
            f"2. Major Developments\n"
            f"3. Product Intelligence\n"
            f"4. Pricing Intelligence\n"
            f"5. Financial Intelligence\n"
            f"6. News & Developments\n"
            f"7. Strategic Moves\n"
            f"8. Risks\n"
            f"9. Opportunities\n"
            f"10. Competitive Threat Assessment (score 0-10, explainable reason)\n"
            f"11. Strategic Implications\n"
            f"12. Sources & Evidence\n\n"
            f"Respond with a JSON object matching this schema:\n"
            f"{{\n"
            f"  \"title\": \"Executive Competitive Intelligence Briefing: {competitor}\",\n"
            f"  \"executive_summary\": \"...\",\n"
            f"  \"threat_score\": 8.5,\n"
            f"  \"threat_explanation\": \"...\",\n"
            f"  \"sections\": {{\n"
            f"      \"major_developments\": [\"...\"],\n"
            f"      \"product_intelligence\": [\"...\"],\n"
            f"      \"pricing_intelligence\": [\"...\"],\n"
            f"      \"financial_intelligence\": [\"...\"],\n"
            f"      \"news_developments\": [\"...\"],\n"
            f"      \"strategic_moves\": [\"...\"],\n"
            f"      \"risks\": [\"...\"],\n"
            f"      \"opportunities\": [\"...\"],\n"
            f"      \"competitive_threat_assessment\": {{\"score\": 8.5, \"verdict\": \"...\"}},\n"
            f"      \"strategic_implications\": [\"...\"],\n"
            f"      \"sources_and_evidence\": [\"...\"]\n"
            f"  }},\n"
            f"  \"metadata\": {{\"total_sources\": {len(sources)}, \"total_findings\": {len(findings)}}}\n"
            f"}}"
        )

        try:
            res = await llm.ainvoke([
                SystemMessage(content="You are an elite corporate intelligence synthesizer. Output only valid JSON."),
                HumanMessage(content=prompt)
            ])
            raw_text = res.content.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1].split("```")[0].strip()

            report = json.loads(raw_text)
        except Exception as exc:
            logger.warning(f"[Synthesis] LLM report synthesis error: {exc}. Using demo fallback.")
            report = dict(DEMO_REPORT)
            report["title"] = f"[DEMO] Executive Competitive Intelligence Briefing: {competitor}"

    end_time = datetime.now(timezone.utc).isoformat()
    return {
        "report": report,
        "agent_progress": {
            **state.get("agent_progress", {}),
            "synthesis": {
                "agent_name": "synthesis",
                "status": "completed",
                "message": f"Generated final report: '{report.get('title', 'Intelligence Report')}'",
                "started_at": start_time,
                "completed_at": end_time,
            },
        },
    }
