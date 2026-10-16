"""Realistic demo data fixtures for Microsoft competitive intelligence analysis."""

from datetime import datetime, timezone
from typing import Any, Dict, List

DEMO_COMPETITOR: Dict[str, Any] = {
    "name": "Microsoft Corporation",
    "description": (
        "[DEMO] Global technology leader providing cloud infrastructure (Azure), "
        "productivity software (Microsoft 365), enterprise AI platforms (Copilot, Azure OpenAI), "
        "developer tools (GitHub), and personal computing."
    ),
    "website": "https://www.microsoft.com",
    "industry": "Enterprise Software & Cloud Computing",
    "urls": [
        "https://www.microsoft.com",
        "https://azure.microsoft.com",
        "https://www.microsoft.com/microsoft-365",
        "https://news.microsoft.com",
        "https://www.microsoft.com/investor",
    ],
}

DEMO_RESEARCH_TASKS: List[Dict[str, Any]] = [
    {
        "task_id": "task-01-web",
        "agent": "web_research",
        "description": "[DEMO] Scrape official Microsoft Azure and M365 landing pages for product updates and positioning.",
        "status": "pending",
        "priority": 1,
    },
    {
        "task_id": "task-02-news",
        "agent": "news",
        "description": "[DEMO] Aggregate recent global headlines, strategic partnerships, and AI infrastructure investments.",
        "status": "pending",
        "priority": 1,
    },
    {
        "task_id": "task-03-pricing",
        "agent": "product_pricing",
        "description": "[DEMO] Analyze tiering and unit economics for Microsoft 365 Copilot and Azure AI tokens.",
        "status": "pending",
        "priority": 2,
    },
    {
        "task_id": "task-04-financial",
        "agent": "financial_rag",
        "description": "[DEMO] Query SEC Form 10-K / 10-Q disclosures on Intelligent Cloud segment margin and capex trajectory.",
        "status": "pending",
        "priority": 2,
    },
    {
        "task_id": "task-05-verification",
        "agent": "verification",
        "description": "[DEMO] Cross-check Copilot seat pricing, GPU capex figures, and cloud growth metrics across agents.",
        "status": "pending",
        "priority": 3,
    },
    {
        "task_id": "task-06-synthesis",
        "agent": "synthesis",
        "description": "[DEMO] Synthesize verified intelligence into an executive threat briefing and strategic report.",
        "status": "pending",
        "priority": 4,
    },
]

DEMO_SOURCES: List[Dict[str, Any]] = [
    {
        "url": "https://www.microsoft.com/en-us/microsoft-365/enterprise/copilot-pricing",
        "title": "Microsoft 365 Copilot Enterprise Pricing & Licensing",
        "source_type": "website",
        "content_snippet": (
            "[DEMO] Microsoft 365 Copilot is available as an add-on for commercial customers "
            "with Microsoft 365 E3, E5, Business Standard, or Business Premium licenses for $30 per user per month."
        ),
        "credibility_score": 0.98,
    },
    {
        "url": "https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/",
        "title": "Azure OpenAI Service Pricing & Provisioned Throughput",
        "source_type": "website",
        "content_snippet": (
            "[DEMO] Azure OpenAI Service offers pay-as-you-go token pricing and Provisioned Throughput Units (PTU) "
            "with 99.9% uptime SLA and enterprise compliance isolation."
        ),
        "credibility_score": 0.96,
    },
    {
        "url": "https://www.sec.gov/edgar/data/789019/msft-10k.htm",
        "title": "Microsoft SEC Form 10-K Annual Report (FY2024)",
        "source_type": "filing",
        "content_snippet": (
            "[DEMO] Public filing note: Intelligent Cloud segment revenue reached $105.4 billion, "
            "representing 19% year-over-year expansion driven by Azure consumption and enterprise data services."
        ),
        "credibility_score": 0.99,
    },
    {
        "url": "https://news.microsoft.com/2024/ai-infrastructure-expansion",
        "title": "Microsoft Newsroom: Next-Gen AI Datacenter Infrastructure Expansion",
        "source_type": "news",
        "content_snippet": (
            "[DEMO] Microsoft announced multi-billion dollar capital expenditure plans to construct "
            "custom liquid-cooled data facilities equipped with Maia 100 AI accelerators and Nvidia GB200 systems."
        ),
        "credibility_score": 0.92,
    },
    {
        "url": "https://techcrunch.com/2024/microsoft-enterprise-promo-rumor",
        "title": "Industry Newsletter: Enterprise Volume Discount Speculation",
        "source_type": "news",
        "content_snippet": (
            "[DEMO] Unofficial industry reporting claimed some Fortune 50 enterprise contracts received "
            "introductory Copilot promotional rates near $20 per user per month on multi-year commitments."
        ),
        "credibility_score": 0.65,
    },
]

DEMO_FINDINGS: List[Dict[str, Any]] = [
    {
        "agent": "web_research",
        "category": "product",
        "title": "[DEMO] Deep Copilot Integration Across Office Suite",
        "content": (
            "[DEMO] Microsoft has embedded Copilot directly into Word, Excel, PowerPoint, Teams, and Outlook. "
            "Recent additions include Autonomous Agent capabilities inside Copilot Studio for enterprise workflows."
        ),
        "confidence": 0.95,
        "evidence_type": "verified_fact",
        "sources": [
            "https://www.microsoft.com/en-us/microsoft-365/enterprise/copilot-pricing"
        ],
    },
    {
        "agent": "product_pricing",
        "category": "pricing",
        "title": "[DEMO] Microsoft 365 Copilot List Price at $30/user/month",
        "content": (
            "[DEMO] Official published list pricing for Microsoft 365 Copilot requires an existing E3/E5 or Business tier "
            "and bills at $30/user/month with annual commitment."
        ),
        "confidence": 0.94,
        "evidence_type": "verified_fact",
        "sources": [
            "https://www.microsoft.com/en-us/microsoft-365/enterprise/copilot-pricing"
        ],
    },
    {
        "agent": "product_pricing",
        "category": "pricing",
        "title": "[DEMO] Speculative Volume Promotional Pricing Discrepancy",
        "content": (
            "[DEMO] Third-party market reporting indicated select enterprise master service agreements (MSAs) "
            "included pilot pricing as low as $20/user/month, conflicting with published card rates."
        ),
        "confidence": 0.62,
        "evidence_type": "retrieved_info",
        "sources": [
            "https://techcrunch.com/2024/microsoft-enterprise-promo-rumor"
        ],
    },
    {
        "agent": "financial_rag",
        "category": "financial",
        "title": "[DEMO] Public Filing Intelligent Cloud Growth Trajectory",
        "content": (
            "[DEMO] Referenced from public SEC Form 10-K: Intelligent Cloud segment generated over $105B with "
            "operating margins sustained above 44%. Capital expenditures have accelerated significantly into AI server builds."
        ),
        "confidence": 0.98,
        "evidence_type": "verified_fact",
        "sources": ["https://www.sec.gov/edgar/data/789019/msft-10k.htm"],
    },
    {
        "agent": "news",
        "category": "strategic",
        "title": "[DEMO] Aggressive Custom Silicon & Hyperscale Infrastructure Expansion",
        "content": (
            "[DEMO] Microsoft is ramping deployment of in-house Maia 100 AI accelerators alongside top-tier GPU clusters "
            "to reduce reliance on sole-source GPU vendors and strengthen Azure gross margins."
        ),
        "confidence": 0.90,
        "evidence_type": "retrieved_info",
        "sources": [
            "https://news.microsoft.com/2024/ai-infrastructure-expansion"
        ],
    },
]

DEMO_PRODUCT_INTEL: List[Dict[str, Any]] = [
    {
        "product_name": "Microsoft 365 Copilot Studio",
        "change_type": "feature",
        "description": (
            "[DEMO] Launched autonomous agent workflows enabling enterprises to create "
            "custom autonomous agents connected to enterprise data stores via Graph Connectors."
        ),
        "source_url": "https://www.microsoft.com/microsoft-365",
        "detected_at": datetime.now(timezone.utc),
    },
    {
        "product_name": "Azure OpenAI Service - GPT-4o Provisioned Throughput",
        "change_type": "update",
        "description": (
            "[DEMO] Extended PTU reservations to support multi-modal real-time inference with guaranteed latency "
            "and geo-redundant routing for global enterprise compliance."
        ),
        "source_url": "https://azure.microsoft.com",
        "detected_at": datetime.now(timezone.utc),
    },
    {
        "product_name": "Azure Maia 100 Accelerator Cloud Instances",
        "change_type": "launch",
        "description": (
            "[DEMO] Initial production deployment of custom silicon designed for large language model inference "
            "running internal Copilot workloads."
        ),
        "source_url": "https://news.microsoft.com",
        "detected_at": datetime.now(timezone.utc),
    },
]

DEMO_PRICING_INTEL: List[Dict[str, Any]] = [
    {
        "product_name": "Microsoft 365 Copilot",
        "pricing_model": "Per Seat Add-on (Annual)",
        "price_details": {
            "currency": "USD",
            "list_price": 30.0,
            "billing_cycle": "annual",
            "prerequisites": ["Microsoft 365 E3", "Microsoft 365 E5", "Business Standard"],
            "discounts_detected": "Volume MSAs negotiate tier credits",
        },
        "change_description": "[DEMO] Expanded eligibility to Business Standard/Premium; removed minimum 300 seat purchase barrier.",
        "source_url": "https://www.microsoft.com/en-us/microsoft-365/enterprise/copilot-pricing",
        "detected_at": datetime.now(timezone.utc),
    },
    {
        "product_name": "Azure OpenAI GPT-4o API",
        "pricing_model": "Consumption & PTU",
        "price_details": {
            "input_per_million_tokens": 5.0,
            "output_per_million_tokens": 15.0,
            "ptu_minimum_commitment": "1 month reservation",
        },
        "change_description": "[DEMO] Reduced standard token prices and added tiered caching discounts for repeated prompt prefixes.",
        "source_url": "https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/",
        "detected_at": datetime.now(timezone.utc),
    },
]

DEMO_FINANCIAL_INTEL: List[Dict[str, Any]] = [
    {
        "filing_type": "SEC Form 10-K",
        "fiscal_year": "Public Historical Filing FY2024",
        "segment": "Intelligent Cloud",
        "metrics": {
            "segment_revenue": "$105.4B",
            "operating_income": "$47.8B",
            "cloud_gross_margin": "71%",
            "capital_expenditures": "$55.7B (consolidated total)",
        },
        "notes": (
            "[DEMO] Disclosed public information: Azure growth continues to outpace overall cloud market. "
            "Management emphasized ongoing multi-year datacenter buildouts to alleviate AI capacity constraints."
        ),
        "source_document": "Microsoft Investor Relations / SEC EDGAR",
    }
]

DEMO_NEWS_ITEMS: List[Dict[str, Any]] = [
    {
        "title": "[DEMO] Microsoft Expands Strategic AI Partnership Ecosystem",
        "summary": (
            "[DEMO] Expanded partnership agreements with foundational model providers and independent software vendors "
            "to ensure Azure remains the preferred host for enterprise generative AI."
        ),
        "url": "https://news.microsoft.com/2024/ai-infrastructure-expansion",
        "source_name": "Microsoft Newsroom",
        "category": "ai",
        "published_at": datetime.now(timezone.utc),
        "sentiment": "positive",
    },
    {
        "title": "[DEMO] Global Sovereign Cloud Offerings Launched Across Europe",
        "summary": (
            "[DEMO] Unveiled enhanced sovereign cloud boundaries permitting European public sector entities to retain "
            "full operational encryption control on sovereign soil."
        ),
        "url": "https://news.microsoft.com",
        "source_name": "Tech Wire",
        "category": "market_expansion",
        "published_at": datetime.now(timezone.utc),
        "sentiment": "neutral",
    },
]

DEMO_CLAIMS: List[Dict[str, Any]] = [
    {
        "claim_text": "[DEMO] Microsoft 365 Copilot standard list price is $30 per user per month billed annually.",
        "source_agent": "product_pricing",
        "verification_status": "verified",
        "confidence": 0.98,
        "evidence": [
            "https://www.microsoft.com/en-us/microsoft-365/enterprise/copilot-pricing",
            "Official Microsoft product documentation",
        ],
    },
    {
        "claim_text": "[DEMO] Select enterprise volume buyers secure Copilot add-ons at a discounted $20 per user rate.",
        "source_agent": "product_pricing",
        "verification_status": "conflicting",
        "confidence": 0.58,
        "evidence": [
            "https://techcrunch.com/2024/microsoft-enterprise-promo-rumor"
        ],
    },
    {
        "claim_text": "[DEMO] Intelligent Cloud segment exceeded $100B in annual revenue per public SEC Form 10-K.",
        "source_agent": "financial_rag",
        "verification_status": "verified",
        "confidence": 0.99,
        "evidence": ["https://www.sec.gov/edgar/data/789019/msft-10k.htm"],
    },
    {
        "claim_text": "[DEMO] Microsoft Copilot Studio supports multi-agent autonomous execution workflows.",
        "source_agent": "web_research",
        "verification_status": "verified",
        "confidence": 0.94,
        "evidence": ["https://www.microsoft.com/microsoft-365"],
    },
]

DEMO_CONFLICTS: List[Dict[str, Any]] = [
    {
        "claim_a": "[DEMO] Microsoft 365 Copilot standard list price is $30 per user per month billed annually.",
        "claim_b": "[DEMO] Select enterprise volume buyers secure Copilot add-ons at a discounted $20 per user rate.",
        "description": (
            "[DEMO] Conflict identified: Published public pricing strictly mandates $30/user/mo, "
            "whereas third-party channel reports claim unadvertised $20/user/mo enterprise concessions. "
            "The disparity arises from standard retail cards versus confidential multi-million-dollar EA negotiations."
        ),
        "resolution": (
            "[DEMO] Resolution: Formal list rate remains $30/user/mo with no retail concession; "
            "$20/user figure represents unverified channel rumors or bundled E5 ramp subsidies."
        ),
        "resolved": True,
    }
]

DEMO_REPORT: Dict[str, Any] = {
    "title": "[DEMO] Executive Competitive Intelligence Briefing: Microsoft Corporation",
    "executive_summary": (
        "[DEMO] Microsoft maintains an aggressive competitive moat across enterprise AI by tightly coupling "
        "Azure infrastructure, proprietary foundation models, and ubiquitous productivity seats (Office 365). "
        "While capital expenditures on datacenters and custom Maia silicon have risen steeply, cloud revenue growth "
        "and 70%+ gross margins substantiate sustained pricing leverage and high defensive barrier."
    ),
    "threat_score": 8.7,
    "threat_explanation": (
        "[DEMO] High competitive threat (8.7/10). Microsoft's ability to bundle AI capabilities directly into "
        "already-contracted enterprise productivity workflows (M365) creates intense pressure on standalone "
        "point solutions and competing SaaS vendors."
    ),
    "sections": {
        "major_developments": [
            "[DEMO] Launch of autonomous agent builder within Microsoft 365 Copilot Studio.",
            "[DEMO] Rapid deployment of custom Maia 100 AI inference chips across flagship datacenters.",
            "[DEMO] Removal of 300-seat minimum requirement for commercial Copilot adoption.",
        ],
        "product_intelligence": [
            "[DEMO] Copilot ecosystem has expanded beyond basic text generation into active graph agents.",
            "[DEMO] Azure OpenAI Service provides dedicated throughput guarantees (PTUs) for mission-critical enterprise workloads.",
        ],
        "pricing_intelligence": [
            "[DEMO] Published list rate of $30/user/month represents a significant premium over base E3 licensing ($36/user/mo), effectively doubling seat revenue for fully converted accounts.",
            "[DEMO] Channel rumors of $20/user pilot rates exist but remain unadvertised promotional concessions.",
        ],
        "financial_intelligence": [
            "[DEMO] Referenced public 10-K: Intelligent Cloud segment revenue surpassed $105B with operating margins above 44%.",
            "[DEMO] Capital expenditures exceeded $50B, primarily directed toward next-generation liquid-cooled AI facilities.",
        ],
        "news_developments": [
            "[DEMO] Strategic alliances with foundational AI labs continue to anchor enterprise developer mindshare.",
            "[DEMO] Sovereign cloud expansions in the EU provide strong regulatory insulation against data sovereignty challenges.",
        ],
        "strategic_moves": [
            "[DEMO] Bundling strategy: Integrating generative AI into daily enterprise habit loops (Outlook, Teams, Excel).",
            "[DEMO] Vertical silicon integration: Developing first-party accelerators to insulate against hardware margin erosion.",
        ],
        "risks": [
            "[DEMO] High enterprise seat price ($30/user/mo) facing scrutiny regarding realized end-user ROI.",
            "[DEMO] Immense capital commitments requiring sustained double-digit AI revenue monetization to protect return on invested capital (ROIC).",
        ],
        "opportunities": [
            "[DEMO] Compelling upside in converting 400M+ commercial Office 365 seats into Copilot subscribers.",
            "[DEMO] Capturing enterprise data pipelines via Microsoft Fabric and Azure Synapse.",
        ],
        "competitive_threat_assessment": {
            "score": 8.7,
            "category": "Critical Threat",
            "verdict": "[DEMO] Pervasive distribution advantage and enterprise compliance trust position Microsoft as the primary benchmark competitor.",
        },
        "strategic_implications": [
            "[DEMO] Direct feature competition with Microsoft Copilot is inadvisable; product positioning should focus on deep vertical workflows, model flexibility, and rapid time-to-value.",
            "[DEMO] Pricing architecture must provide transparent usage-based or ROI-tied pricing to contrast with Microsoft's fixed $30/user seat tax.",
        ],
        "sources_and_evidence": [
            "https://www.microsoft.com/en-us/microsoft-365/enterprise/copilot-pricing",
            "https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/",
            "https://www.sec.gov/edgar/data/789019/msft-10k.htm",
            "https://news.microsoft.com/2024/ai-infrastructure-expansion",
        ],
    },
    "metadata": {
        "pipeline_version": "1.0.0",
        "data_freshness": "demo_fixture",
        "verification_rate": "100%",
    },
}
