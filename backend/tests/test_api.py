"""API integration tests using an isolated async test database."""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.database import Base, get_db
from backend.app.main import app

# Isolated in-memory SQLite database for testing
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestingSessionLocal = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False
)


async def override_get_db():
    """Dependency override providing isolated in-memory DB session."""
    async with TestingSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


import pytest_asyncio

@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    """Create all schema tables prior to running test cases."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_health_and_settings():
    """Verify health endpoints and safe configuration exposure."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "online"

        res_settings = await ac.get("/api/settings/")
        assert res_settings.status_code == 200
        data = res_settings.json()
        assert "demo_mode" in data
        assert "llm_provider" in data
        # Ensure secrets are never exposed
        assert "api_key" not in data


@pytest.mark.asyncio
async def test_competitors_crud():
    """Verify full CRUD lifecycle for competitor entity."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Create competitor
        payload = {
            "name": "Google LLC",
            "description": "Multinational technology conglomerate focusing on search and cloud.",
            "website": "https://about.google",
            "industry": "Search & Cloud Infrastructure",
            "urls": ["https://cloud.google.com"],
        }
        res = await ac.post("/api/competitors/", json=payload)
        assert res.status_code == 201
        created = res.json()
        comp_id = created["id"]
        assert created["name"] == "Google LLC"

        # 2. Get single competitor
        res_get = await ac.get(f"/api/competitors/{comp_id}")
        assert res_get.status_code == 200
        assert res_get.json()["name"] == "Google LLC"

        # 3. Update competitor
        res_update = await ac.put(
            f"/api/competitors/{comp_id}",
            json={"industry": "Cloud & AI Research"},
        )
        assert res_update.status_code == 200
        assert res_update.json()["industry"] == "Cloud & AI Research"

        # 4. List competitors
        res_list = await ac.get("/api/competitors/")
        assert res_list.status_code == 200
        assert len(res_list.json()) >= 1

        # 5. Delete competitor
        res_del = await ac.delete(f"/api/competitors/{comp_id}")
        assert res_del.status_code == 200

        # Verify not found after deletion
        res_missing = await ac.get(f"/api/competitors/{comp_id}")
        assert res_missing.status_code == 404


@pytest.mark.asyncio
async def test_research_run_creation_and_retrieval():
    """Verify triggering research run and inspecting details."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create competitor first
        comp_res = await ac.post(
            "/api/competitors/",
            json={"name": "Amazon AWS", "urls": ["https://aws.amazon.com"]},
        )
        comp_id = comp_res.json()["id"]

        # Trigger research run
        run_res = await ac.post(
            "/api/research/run",
            json={"competitor_id": comp_id, "query": "Analyze Bedrock pricing models"},
        )
        assert run_res.status_code == 201
        run_data = run_res.json()
        assert run_data["competitor_id"] == comp_id
        run_id = run_data["id"]

        # List runs
        list_res = await ac.get("/api/research/runs")
        assert list_res.status_code == 200
        assert any(r["id"] == run_id for r in list_res.json())

        # Get run details
        detail_res = await ac.get(f"/api/research/runs/{run_id}")
        assert detail_res.status_code == 200
        assert detail_res.json()["id"] == run_id


@pytest.mark.asyncio
async def test_intelligence_endpoints():
    """Verify intelligence aggregation and dashboard endpoints."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        dash_res = await ac.get("/api/intelligence/dashboard")
        assert dash_res.status_code == 200
        stats = dash_res.json()
        assert "total_competitors" in stats
        assert "total_runs" in stats

        prod_res = await ac.get("/api/intelligence/products")
        assert prod_res.status_code == 200

        pricing_res = await ac.get("/api/intelligence/pricing")
        assert pricing_res.status_code == 200

        news_res = await ac.get("/api/intelligence/news")
        assert news_res.status_code == 200

        rep_res = await ac.get("/api/intelligence/reports")
        assert rep_res.status_code == 200
