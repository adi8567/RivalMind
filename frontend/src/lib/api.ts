import {
  Competitor,
  ResearchRun,
  Source,
  Finding,
  ProductIntel,
  PricingIntel,
  NewsItem,
  Claim,
  Conflict,
  Report,
  DashboardStats,
  SettingsInfo,
} from '@/types';
import {
  mockCompetitors,
  mockResearchRuns,
  mockSources,
  mockFindings,
  mockProducts,
  mockPricing,
  mockNews,
  mockClaims,
  mockConflicts,
  mockReports,
  mockDashboardStats,
  mockSettings,
} from './mock-data';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

let isDemoFallbackActive = false;

export function getIsDemoFallbackActive(): boolean {
  return isDemoFallbackActive;
}

// In-memory store for client demo mutations
let dynamicCompetitors: Competitor[] = [...mockCompetitors];
let dynamicRuns: ResearchRun[] = [...mockResearchRuns];

async function apiRequest<T>(endpoint: string, options: RequestInit = {}, fallbackData?: T): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    isDemoFallbackActive = false;
    return data as T;
  } catch (err) {
    // Graceful fallback to mock data
    console.warn(`API call to ${url} failed or timed out. Falling back to realistic demo data.`, err);
    isDemoFallbackActive = true;
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    throw err;
  }
}

// 1. Competitors
export async function fetchCompetitors(): Promise<Competitor[]> {
  return apiRequest<Competitor[]>('/api/competitors', { method: 'GET' }, dynamicCompetitors);
}

export async function createCompetitor(data: Partial<Competitor>): Promise<Competitor> {
  try {
    return await apiRequest<Competitor>('/api/competitors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    const newComp: Competitor = {
      id: `comp-${Date.now()}`,
      name: data.name || 'New Competitor',
      industry: data.industry || 'Technology',
      website: data.website || 'https://example.com',
      monitoring_urls: data.monitoring_urls || [],
      description: data.description || '',
      threat_score: 50,
      created_at: new Date().toISOString(),
      url_count: (data.monitoring_urls || []).length,
    };
    dynamicCompetitors = [newComp, ...dynamicCompetitors];
    return newComp;
  }
}

export async function getCompetitor(id: string): Promise<Competitor> {
  const fallback = dynamicCompetitors.find((c) => c.id === id) || dynamicCompetitors[0];
  return apiRequest<Competitor>(`/api/competitors/${id}`, { method: 'GET' }, fallback);
}

export async function updateCompetitor(id: string, data: Partial<Competitor>): Promise<Competitor> {
  try {
    return await apiRequest<Competitor>(`/api/competitors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch {
    const idx = dynamicCompetitors.findIndex((c) => c.id === id);
    if (idx !== -1) {
      dynamicCompetitors[idx] = { ...dynamicCompetitors[idx], ...data, updated_at: new Date().toISOString() };
      return dynamicCompetitors[idx];
    }
    throw new Error('Competitor not found in demo data');
  }
}

export async function deleteCompetitor(id: string): Promise<{ success: boolean }> {
  try {
    return await apiRequest<{ success: boolean }>(`/api/competitors/${id}`, {
      method: 'DELETE',
    });
  } catch {
    dynamicCompetitors = dynamicCompetitors.filter((c) => c.id !== id);
    return { success: true };
  }
}

// 2. Research Runs
export async function startResearchRun(competitorId: string, query: string): Promise<ResearchRun> {
  try {
    return await apiRequest<ResearchRun>('/api/research/runs', {
      method: 'POST',
      body: JSON.stringify({ competitor_id: competitorId, query }),
    });
  } catch {
    const comp = dynamicCompetitors.find((c) => c.id === competitorId);
    const newRun: ResearchRun = {
      id: `run-${Date.now()}`,
      competitor_id: competitorId,
      competitor_name: comp?.name || 'Competitor Target',
      query: query || `Analyze competitive movements for ${comp?.name}`,
      status: 'running',
      started_at: new Date().toISOString(),
      duration_seconds: 15,
      current_agent: 'Planner',
      progress_summary: 'Research orchestrated. Agent pipeline executing initial decomposition.',
      agent_progress: {
        planner: { agent_id: 'planner', name: 'Planner Agent', status: 'running', elapsed_seconds: 12, message: 'Decomposing research query...' },
        web_research: { agent_id: 'web_research', name: 'Web Research Agent', status: 'pending' },
        product_pricing: { agent_id: 'product_pricing', name: 'Product/Pricing Agent', status: 'pending' },
        financial: { agent_id: 'financial', name: 'Financial RAG Agent', status: 'pending' },
        news: { agent_id: 'news', name: 'News Intelligence Agent', status: 'pending' },
        verification: { agent_id: 'verification', name: 'Verification Agent', status: 'pending' },
        synthesis: { agent_id: 'synthesis', name: 'Synthesis Agent', status: 'pending' },
      },
    };
    dynamicRuns = [newRun, ...dynamicRuns];
    return newRun;
  }
}

export async function getResearchRuns(): Promise<ResearchRun[]> {
  return apiRequest<ResearchRun[]>('/api/research/runs', { method: 'GET' }, dynamicRuns);
}

export async function getResearchRun(id: string): Promise<ResearchRun> {
  const fallback = dynamicRuns.find((r) => r.id === id) || dynamicRuns[0];
  return apiRequest<ResearchRun>(`/api/research/runs/${id}`, { method: 'GET' }, fallback);
}

export async function getRunSources(runId: string): Promise<Source[]> {
  const fallback = mockSources.filter((s) => s.run_id === runId || runId === 'all');
  return apiRequest<Source[]>(
    `/api/research/runs/${runId}/sources`,
    { method: 'GET' },
    fallback.length > 0 ? fallback : mockSources
  );
}

export async function getRunFindings(runId: string): Promise<Finding[]> {
  const fallback = mockFindings.filter((f) => f.run_id === runId);
  return apiRequest<Finding[]>(
    `/api/research/runs/${runId}/findings`,
    { method: 'GET' },
    fallback.length > 0 ? fallback : mockFindings
  );
}

export async function getRunClaims(runId: string): Promise<Claim[]> {
  const fallback = mockClaims.filter((c) => c.run_id === runId);
  return apiRequest<Claim[]>(
    `/api/research/runs/${runId}/claims`,
    { method: 'GET' },
    fallback.length > 0 ? fallback : mockClaims
  );
}

export async function getRunConflicts(runId: string): Promise<Conflict[]> {
  const fallback = mockConflicts.filter((c) => c.run_id === runId);
  return apiRequest<Conflict[]>(
    `/api/research/runs/${runId}/conflicts`,
    { method: 'GET' },
    fallback.length > 0 ? fallback : mockConflicts
  );
}

// 3. Intelligence Feeds
export async function getProducts(competitorId?: string): Promise<ProductIntel[]> {
  const fallback = competitorId
    ? mockProducts.filter((p) => p.competitor_id === competitorId)
    : mockProducts;
  const endpoint = competitorId ? `/api/products?competitor_id=${competitorId}` : '/api/products';
  return apiRequest<ProductIntel[]>(endpoint, { method: 'GET' }, fallback);
}

export async function getPricing(competitorId?: string): Promise<PricingIntel[]> {
  const fallback = competitorId
    ? mockPricing.filter((p) => p.competitor_id === competitorId)
    : mockPricing;
  const endpoint = competitorId ? `/api/pricing?competitor_id=${competitorId}` : '/api/pricing';
  return apiRequest<PricingIntel[]>(endpoint, { method: 'GET' }, fallback);
}

export async function getNews(competitorId?: string): Promise<NewsItem[]> {
  const fallback = competitorId
    ? mockNews.filter((n) => n.competitor_id === competitorId)
    : mockNews;
  const endpoint = competitorId ? `/api/news?competitor_id=${competitorId}` : '/api/news';
  return apiRequest<NewsItem[]>(endpoint, { method: 'GET' }, fallback);
}

// 4. Reports
export async function getReports(): Promise<Report[]> {
  return apiRequest<Report[]>('/api/reports', { method: 'GET' }, mockReports);
}

export async function getReport(id: string): Promise<Report> {
  const fallback = mockReports.find((r) => r.id === id || r.run_id === id) || mockReports[0];
  return apiRequest<Report>(`/api/reports/${id}`, { method: 'GET' }, fallback);
}

// 5. Dashboard & System Settings
export async function getDashboardStats(): Promise<DashboardStats> {
  return apiRequest<DashboardStats>('/api/dashboard', { method: 'GET' }, {
    ...mockDashboardStats,
    recent_runs: dynamicRuns,
  });
}

export async function getSettings(): Promise<SettingsInfo> {
  return apiRequest<SettingsInfo>('/api/settings', { method: 'GET' }, mockSettings);
}

// 6. SSE Progress Subscription
export function subscribeToProgress(runId: string): EventSource | null {
  if (typeof window === 'undefined') return null;
  const url = `${API_BASE}/api/research/runs/${runId}/progress`;
  try {
    const eventSource = new EventSource(url);
    return eventSource;
  } catch (err) {
    console.warn(`Unable to connect SSE stream at ${url}:`, err);
    return null;
  }
}
