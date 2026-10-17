# RivalMind: The Multi-Agent Intelligence Engine That Turns Competitor Moves Into Your Next Masterstroke

A full-stack enterprise AI platform where multiple specialized agents autonomously research competitors, analyze product/pricing changes, process financial documents, monitor news, verify conflicting information, and generate evidence-backed executive intelligence reports.

![Architecture](https://img.shields.io/badge/Architecture-Multi--Agent-blue)
![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20LangGraph-green)
![Frontend](https://img.shields.io/badge/Frontend-Next.js%20%2B%20TypeScript-purple)
![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20Pinecone-orange)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Agents](#agents)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage](#usage)
- [RAG Pipeline](#rag-pipeline)
- [Demo Mode](#demo-mode)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Project Structure](#project-structure)

---

##  Overview

The CI Orchestrator provides automated competitive intelligence through a pipeline of specialized AI agents:

1. **Add a competitor** with their website URLs
2. **Start an analysis** with a natural language query
3. **Watch agents execute** in real-time via SSE progress updates
4. **Review findings** — sources, product intel, pricing, financials, news
5. **Verify claims** — the system detects and flags conflicting information
6. **Read the executive report** — comprehensive, evidence-backed intelligence

### Key Principles

- ✅ Every factual claim has supporting evidence/source information
- ✅ Clear distinction between verified facts, retrieved info, and AI interpretation
- ✅ Never fabricates prices, financial numbers, dates, URLs, or sources
- ✅ Explicitly states when evidence is insufficient
- ✅ Prefers official company sources, regulatory filings, and reputable publications
- ✅ Never silently resolves conflicting information

---

## Architecture

```
Next.js Frontend
    ↓ REST + SSE
FastAPI Backend
    ↓
LangGraph Orchestrator
    ↓
┌─────────────────────────────────────────────┐
│  Planner → Web Research → Product/Pricing   │
│            → Financial RAG → News           │
│            → Verification → Synthesis       │
└─────────────────────────────────────────────┘
    ↓                    ↓
PostgreSQL           Pinecone
(structured)      (vector search)
    ↓
Executive Intelligence Report
```

### Data Flow

1. User submits a competitor analysis request
2. **Planner Agent** decomposes the request into research tasks
3. **Web Research Agent** scrapes competitor websites (Playwright + BeautifulSoup)
4. **Product & Pricing Agent** structures product/pricing intelligence
5. **Financial RAG Agent** analyzes financial documents via RAG pipeline
6. **News Agent** finds and categorizes recent news
7. **Verification Agent** cross-references claims and detects conflicts
8. **Synthesis Agent** produces the final executive report

---

##  Agents

| Agent | Purpose | Key Capabilities |
|-------|---------|-------------------|
| **Planner** | Task decomposition | Breaks user query into structured research tasks |
| **Web Research** | Data collection | Playwright for dynamic pages, BS4/httpx for static |
| **Product & Pricing** | Structuring | Categorizes product launches, features, pricing changes |
| **Financial RAG** | Document analysis | RAG pipeline: chunk → embed → Pinecone → retrieve → analyze |
| **News** | News monitoring | NewsAPI integration, categorization, sentiment analysis |
| **Verification** | Claim verification | Cross-references sources, detects conflicts, rates confidence |
| **Synthesis** | Report generation | Produces executive report with evidence and threat assessment |

---

##  Tech Stack

### Frontend
- **Next.js 14** — React framework with App Router
- **TypeScript** — Type safety
- **Tailwind CSS** — Utility-first styling
- **shadcn/ui** — Component patterns
- **Recharts** — Data visualization
- **Lucide React** — Icons

### Backend
- **Python 3.11+** — Runtime
- **FastAPI** — Async API framework
- **LangGraph** — Agent orchestration
- **LangChain** — LLM integration
- **SQLAlchemy 2.0** — Async ORM
- **Playwright** — Dynamic web scraping
- **BeautifulSoup4** — HTML parsing
- **httpx** — Async HTTP client

### Data
- **PostgreSQL 16** — Structured data (competitors, findings, reports)
- **Pinecone** — Vector database for financial document RAG
- **SSE** — Server-Sent Events for live progress updates

---

##  Quick Start

### Prerequisites

- Docker & Docker Compose (recommended)
- OR: Python 3.11+, Node.js 20+, PostgreSQL 16

### Using Docker (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd multi-agent-ci-orchestrator

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker-compose up -d

# 4. Open the dashboard
open http://localhost:3000
```

### Manual Setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers (optional, for live web research)
playwright install chromium

# Create PostgreSQL database
createdb ci_orchestrator

# Start the API server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

#### Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

##  Configuration

All configuration is via environment variables. See `.env.example` for the full list.

### Key Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `DEMO_MODE` | `true` | Use demo data (no API keys needed) |
| `LLM_PROVIDER` | `openai` | LLM provider: `openai` or `anthropic` |
| `LLM_MODEL` | `gpt-4o-mini` | Model name |
| `LLM_API_KEY` | — | Your LLM API key |
| `PINECONE_API_KEY` | — | Pinecone API key for RAG |
| `NEWS_API_KEY` | — | NewsAPI key for news agent |
| `DATABASE_URL` | `postgresql+asyncpg://...` | PostgreSQL connection |

### Switching to Live Mode

1. Set `DEMO_MODE=false` in your `.env`
2. Add your `LLM_API_KEY`
3. Optionally add `PINECONE_API_KEY` and `NEWS_API_KEY`
4. Restart the backend

---

##  Usage

### 1. Add a Competitor

Navigate to **Competitors** → **Add Competitor**. Enter:
- Company name
- Description
- Website URL
- Industry
- Specific URLs to monitor (product pages, pricing pages, etc.)

### 2. Start Analysis

Click **New Analysis** on any competitor. Enter a query like:
> "Analyze Microsoft's competitive position over the last 30 days"

### 3. Monitor Progress

The Research Run page shows real-time agent progress:
```
Planner ✓ → Web Research ✓ → Product/Pricing ● → Financial ○ → News ✓ → Verification ○ → Synthesis ○
```

### 4. Review Intelligence

Explore findings across tabs:
- **Sources**: All discovered sources with credibility scores
- **Findings**: Categorized intelligence with confidence levels
- **Claims**: Verified claims with evidence
- **Conflicts**: Detected conflicting information

### 5. Read the Report

The executive report includes:
- Executive Summary
- Competitive Threat Score (with explanation)
- Product, Pricing, Financial, and News Intelligence
- Strategic Analysis
- Risks and Opportunities
- Complete source citations

---

##  RAG Pipeline

The Financial Intelligence Agent uses a Retrieval-Augmented Generation pipeline:

```
Financial Documents (SEC filings, annual reports, earnings transcripts)
    ↓
Document Chunking (recursive character splitter)
    ↓
Embedding Generation (OpenAI embeddings)
    ↓
Vector Storage (Pinecone)
    ↓
Semantic Retrieval (query-based search)
    ↓
LLM Analysis (evidence-backed findings)
    ↓
Structured Financial Intelligence
```

In demo mode, the RAG pipeline returns realistic sample data without requiring Pinecone credentials.

---

##  Demo Mode

Demo mode (`DEMO_MODE=true`) provides:

- Realistic sample data for Microsoft competitive analysis
- Full pipeline execution simulation
- All UI features functional
- Data clearly marked as `[DEMO]`
- No API keys required

**Demo mode is enabled by default** so you can explore the full application immediately.

---

##  API Reference

### Competitors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/competitors` | List all competitors |
| POST | `/api/competitors` | Create competitor |
| GET | `/api/competitors/{id}` | Get competitor |
| PUT | `/api/competitors/{id}` | Update competitor |
| DELETE | `/api/competitors/{id}` | Delete competitor |

### Research
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/research/run` | Start research run |
| GET | `/api/research/runs` | List runs |
| GET | `/api/research/runs/{id}` | Get run details |
| GET | `/api/research/runs/{id}/progress` | SSE progress stream |
| GET | `/api/research/runs/{id}/sources` | Run sources |
| GET | `/api/research/runs/{id}/findings` | Run findings |
| GET | `/api/research/runs/{id}/claims` | Run claims |
| GET | `/api/research/runs/{id}/conflicts` | Run conflicts |

### Intelligence
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/intelligence/products` | Product intelligence |
| GET | `/api/intelligence/pricing` | Pricing intelligence |
| GET | `/api/intelligence/news` | News items |
| GET | `/api/intelligence/reports` | List reports |
| GET | `/api/intelligence/reports/{id}` | Full report |
| GET | `/api/intelligence/dashboard` | Dashboard stats |

Full interactive docs: http://localhost:8000/docs

---

##  Testing

```bash
cd backend

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_agents.py
pytest tests/test_api.py
```

---

##  Project Structure

```
multi-agent-ci-orchestrator/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Settings & environment
│   │   ├── database.py          # Async SQLAlchemy setup
│   │   ├── models/
│   │   │   └── models.py        # SQLAlchemy models
│   │   ├── schemas/
│   │   │   └── schemas.py       # Pydantic schemas
│   │   ├── api/
│   │   │   ├── competitors.py   # Competitor CRUD
│   │   │   ├── research.py      # Research runs & SSE
│   │   │   ├── intelligence.py  # Intel & reports
│   │   │   └── settings_api.py  # Settings & health
│   │   ├── agents/
│   │   │   ├── state.py         # LangGraph shared state
│   │   │   ├── llm.py           # LLM provider factory
│   │   │   ├── orchestrator.py  # LangGraph graph
│   │   │   ├── planner.py       # Planner agent
│   │   │   ├── web_research.py  # Web scraper agent
│   │   │   ├── product_pricing.py # Product & pricing
│   │   │   ├── financial_rag.py # Financial RAG agent
│   │   │   ├── news.py          # News agent
│   │   │   ├── verification.py  # Verification agent
│   │   │   └── synthesis.py     # Report synthesis
│   │   ├── services/
│   │   │   ├── db_service.py    # Database operations
│   │   │   ├── demo_data.py     # Demo data generator
│   │   │   └── research_service.py # Research orchestration
│   │   └── utils/
│   │       └── helpers.py       # Utility functions
│   ├── tests/
│   │   ├── test_agents.py
│   │   └── test_api.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js pages
│   │   ├── components/          # React components
│   │   ├── lib/                 # API client & utils
│   │   └── types/               # TypeScript types
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

##  License

MIT License

---
4. Run tests
5. Submit a pull request

---

Built with ❤️ using LangGraph, FastAPI, and Next.js
