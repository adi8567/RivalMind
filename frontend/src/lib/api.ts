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

// In-memory store for client demo mutations if offline
let dynamicCompetitors: Competitor[] = [...mockCompetitors];
let dynamicRuns: ResearchRun[] = [...mockResearchRuns];

async function apiRequest<T>(endpoint: string, options: RequestInit = {}, fallbackData?: T): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

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
    console.warn(`API call to ${url} encountered issue. Using local fallback.`, err);
    isDemoFallbackActive = true;
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    throw err;
  }
}

// 1. Competitors
export async function fetchCompetitors(): Promise<Competitor[]> {
  try {
    const data = await apiRequest<any[]>('/api/competitors', { method: 'GET' });
    if (Array.isArray(data)) {
      return data.map((c) => ({
        id: String(c.id),
        name: c.name,
        industry: c.industry || 'Technology',
        website: c.website || '',
        monitoring_urls: c.urls || c.monitoring_urls || [],
        description: c.description || '',
        threat_score: c.threat_score ?? 68,
        created_at: c.created_at || new Date().toISOString(),
        url_count: (c.urls || c.monitoring_urls || []).length,
      }));
    }
    return dynamicCompetitors;
  } catch {
    return dynamicCompetitors;
  }
}

export async function createCompetitor(data: Partial<Competitor>): Promise<Competitor> {
  try {
    const payload = {
      name: data.name,
      description: data.description,
      website: data.website,
      industry: data.industry,
      urls: data.monitoring_urls || [],
    };
    const c = await apiRequest<any>('/api/competitors', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return {
      id: String(c.id),
      name: c.name,
      industry: c.industry || 'Technology',
      website: c.website || '',
      monitoring_urls: c.urls || [],
      description: c.description || '',
      threat_score: 65,
      created_at: c.created_at,
      url_count: (c.urls || []).length,
    };
  } catch {
    const newComp: Competitor = {
      id: `comp-${Date.now()}`,
      name: data.name || 'New Competitor',
      industry: data.industry || 'Technology',
      website: data.website || 'https://example.com',
      monitoring_urls: data.monitoring_urls || [],
      description: data.description || '',
      threat_score: 55,
      created_at: new Date().toISOString(),
      url_count: (data.monitoring_urls || []).length,
    };
    dynamicCompetitors = [newComp, ...dynamicCompetitors];
    return newComp;
  }
}

export async function getCompetitor(id: string): Promise<Competitor> {
  try {
    const c = await apiRequest<any>(`/api/competitors/${id}`, { method: 'GET' });
    return {
      id: String(c.id),
      name: c.name,
      industry: c.industry || 'Technology',
      website: c.website || '',
      monitoring_urls: c.urls || [],
      description: c.description || '',
      threat_score: c.threat_score ?? 68,
      created_at: c.created_at,
      url_count: (c.urls || []).length,
    };
  } catch {
    const fallback = dynamicCompetitors.find((c) => c.id === id) || dynamicCompetitors[0];
    return fallback;
  }
}

export async function updateCompetitor(id: string, data: Partial<Competitor>): Promise<Competitor> {
  try {
    const payload = {
      name: data.name,
      description: data.description,
      website: data.website,
      industry: data.industry,
      urls: data.monitoring_urls,
    };
    const c = await apiRequest<any>(`/api/competitors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return {
      id: String(c.id),
      name: c.name,
      industry: c.industry || 'Technology',
      website: c.website || '',
      monitoring_urls: c.urls || [],
      description: c.description || '',
      threat_score: c.threat_score ?? 68,
      created_at: c.created_at,
      url_count: (c.urls || []).length,
    };
  } catch {
    const idx = dynamicCompetitors.findIndex((c) => c.id === id);
    if (idx !== -1) {
      dynamicCompetitors[idx] = { ...dynamicCompetitors[idx], ...data, updated_at: new Date().toISOString() };
      return dynamicCompetitors[idx];
    }
    throw new Error('Competitor not found');
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
    const numId = parseInt(competitorId.replace('comp-', ''), 10) || 1;
    const res = await apiRequest<any>('/api/research/run', {
      method: 'POST',
      body: JSON.stringify({ competitor_id: numId, query }),
    });
    return {
      id: String(res.id),
      competitor_id: String(res.competitor_id),
      query: res.query,
      status: res.status,
      started_at: res.started_at || res.created_at,
      agent_progress: res.progress || {},
    };
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
      progress_summary: 'Research orchestrated. Agent pipeline executing.',
      agent_progress: {
        planner: { agent_id: 'planner', name: 'Planner Agent', status: 'running', elapsed_seconds: 10 },
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
  try {
    const data = await apiRequest<any[]>('/api/research/runs', { method: 'GET' });
    if (Array.isArray(data) && data.length > 0) {
      return data.map((r) => ({
        id: String(r.id),
        competitor_id: String(r.competitor_id),
        query: r.query,
        status: r.status,
        started_at: r.started_at || r.created_at,
        completed_at: r.completed_at,
        agent_progress: r.progress || {},
      }));
    }
    return dynamicRuns;
  } catch {
    return dynamicRuns;
  }
}

export async function getResearchRun(id: string): Promise<ResearchRun> {
  try {
    const numId = parseInt(id.replace('run-', ''), 10);
    const r = await apiRequest<any>(`/api/research/runs/${numId || id}`, { method: 'GET' });
    return {
      id: String(r.id),
      competitor_id: String(r.competitor_id),
      competitor_name: r.competitor?.name || `Competitor #${r.competitor_id}`,
      query: r.query,
      status: r.status,
      started_at: r.started_at || r.created_at,
      completed_at: r.completed_at,
      agent_progress: r.progress || {},
    };
  } catch {
    const fallback = dynamicRuns.find((r) => r.id === id) || dynamicRuns[0];
    return fallback;
  }
}

export async function getRunSources(runId: string): Promise<Source[]> {
  try {
    const endpoint = runId === 'all' ? '/api/research/sources' : `/api/research/runs/${runId}/sources`;
    const data = await apiRequest<any[]>(endpoint, { method: 'GET' });
    if (Array.isArray(data) && data.length > 0) {
      return data.map((s) => ({
        id: String(s.id),
        run_id: String(s.research_run_id || runId),
        url: s.url,
        title: s.title || s.url,
        snippet: s.content_snippet || '',
        source_type: s.source_type || 'website',
        credibility_score: Math.round(Number(s.credibility_score || 0.9) * (s.credibility_score <= 1 ? 100 : 1)),
        retrieved_at: s.retrieved_at,
      }));
    }
  } catch (e) {
    // fallback
  }
  return mockSources.filter((s) => s.run_id === runId || runId === 'all');
}

export async function getRunFindings(runId: string): Promise<Finding[]> {
  try {
    const endpoint = runId === 'all' ? '/api/research/findings' : `/api/research/runs/${runId}/findings`;
    const data = await apiRequest<any[]>(endpoint, { method: 'GET' });
    if (Array.isArray(data) && data.length > 0) {
      return data.map((f) => ({
        id: String(f.id),
        run_id: String(f.research_run_id || runId),
        competitor_id: String(f.competitor_id || '1'),
        category: f.category || 'strategic',
        title: f.title,
        summary: f.content,
        confidence: f.confidence >= 0.9 ? 'high' : f.confidence >= 0.7 ? 'medium' : 'low',
        evidence_type: f.evidence_type || 'retrieved_info',
        sources: f.sources || [],
        created_at: f.created_at,
      }));
    }
  } catch (e) {
    // fallback
  }
  return mockFindings.filter((f) => f.run_id === runId || runId === 'all');
}

export async function getRunClaims(runId: string): Promise<Claim[]> {
  try {
    const data = await apiRequest<any[]>(`/api/research/runs/${runId}/claims`, { method: 'GET' });
    if (Array.isArray(data) && data.length > 0) {
      return data.map((c) => ({
        id: String(c.id),
        run_id: String(c.research_run_id || runId),
        claim_text: c.claim_text,
        verification_status: c.verification_status || 'verified',
        confidence: c.confidence || 0.9,
        supporting_evidence: Array.isArray(c.evidence) ? c.evidence.join(', ') : '',
      }));
    }
  } catch (e) {
    // fallback
  }
  return mockClaims.filter((c) => c.run_id === runId);
}

export async function getRunConflicts(runId: string): Promise<Conflict[]> {
  try {
    const data = await apiRequest<any[]>(`/api/research/runs/${runId}/conflicts`, { method: 'GET' });
    if (Array.isArray(data) && data.length > 0) {
      return data.map((cf) => ({
        id: String(cf.id),
        run_id: String(cf.research_run_id || runId),
        statement_a: cf.description,
        statement_b: cf.resolution || 'Pending verification',
        source_a: 'Claim A',
        source_b: 'Claim B',
        resolution_summary: cf.resolution,
        status: cf.resolved ? 'resolved' : 'flagged',
      }));
    }
  } catch (e) {
    // fallback
  }
  return mockConflicts.filter((c) => c.run_id === runId);
}

// 3. Intelligence Feeds
export async function getProducts(competitorId?: string): Promise<ProductIntel[]> {
  const endpoint = competitorId ? `/api/products?competitor_id=${competitorId}` : '/api/products';
  try {
    const data = await apiRequest<any[]>(endpoint, { method: 'GET' });
    if (Array.isArray(data) && data.length > 0) {
      return data.map((p) => ({
        id: String(p.id),
        competitor_id: String(p.competitor_id),
        competitor_name: p.competitor_name || `Competitor #${p.competitor_id}`,
        product_name: p.product_name,
        change_type: p.change_type || 'update',
        description: p.description,
        impact: 'medium',
        detected_at: p.detected_at,
        source_url: p.source_url,
      }));
    }
  } catch {
    // fallback
  }
  return competitorId ? mockProducts.filter((p) => p.competitor_id === competitorId) : mockProducts;
}

export async function getPricing(competitorId?: string): Promise<PricingIntel[]> {
  const endpoint = competitorId ? `/api/pricing?competitor_id=${competitorId}` : '/api/pricing';
  try {
    const data = await apiRequest<any[]>(endpoint, { method: 'GET' });
    if (Array.isArray(data) && data.length > 0) {
      return data.map((p) => ({
        id: String(p.id),
        competitor_id: String(p.competitor_id),
        competitor_name: p.competitor_name || `Competitor #${p.competitor_id}`,
        product_name: p.product_name,
        pricing_model: p.pricing_model || 'Subscription',
        tier_details: JSON.stringify(p.price_details || {}),
        change_description: p.change_description,
        detected_at: p.detected_at,
        source_url: p.source_url,
      }));
    }
  } catch {
    // fallback
  }
  return competitorId ? mockPricing.filter((p) => p.competitor_id === competitorId) : mockPricing;
}

export async function getNews(competitorId?: string): Promise<NewsItem[]> {
  const endpoint = competitorId ? `/api/news?competitor_id=${competitorId}` : '/api/news';
  try {
    const data = await apiRequest<any[]>(endpoint, { method: 'GET' });
    if (Array.isArray(data) && data.length > 0) {
      return data.map((n) => ({
        id: String(n.id),
        competitor_id: String(n.competitor_id),
        competitor_name: n.competitor_name || `Competitor #${n.competitor_id}`,
        title: n.title,
        summary: n.summary,
        source_name: n.source_name || 'News Source',
        source_url: n.url || '',
        sentiment: n.sentiment || 'neutral',
        published_at: n.published_at || n.created_at,
        category: n.category || 'General',
      }));
    }
  } catch {
    // fallback
  }
  return competitorId ? mockNews.filter((n) => n.competitor_id === competitorId) : mockNews;
}

// 4. Reports
export async function getReports(): Promise<Report[]> {
  try {
    const data = await apiRequest<any[]>('/api/reports', { method: 'GET' });
    if (Array.isArray(data) && data.length > 0) {
      return data.map((r) => ({
        id: String(r.id),
        run_id: String(r.research_run_id),
        competitor_id: String(r.competitor_id),
        competitor_name: r.competitor_name || `Competitor #${r.competitor_id}`,
        title: r.title,
        threat_score: r.threat_score ?? 70,
        executive_summary: r.executive_summary,
        major_developments: r.sections?.major_developments || [],
        product_intel: r.sections?.product_intelligence || [],
        pricing_intel: r.sections?.pricing_intelligence || [],
        financial_intel: r.sections?.financial_intelligence || [],
        news_intel: r.sections?.news_developments || [],
        strategic_moves: r.sections?.strategic_moves || [],
        risks: r.sections?.risks || [],
        opportunities: r.sections?.opportunities || [],
        threat_assessment: r.threat_explanation || '',
        strategic_implications: r.sections?.strategic_implications || '',
        sources: (r.sections?.sources_and_evidence || []).map((url: string, i: number) => ({
          id: `src-${i}`,
          run_id: String(r.research_run_id),
          url,
          title: url,
          source_type: 'website',
          credibility_score: 95,
          retrieved_at: r.created_at,
        })),
        created_at: r.created_at,
      }));
    }
  } catch {
    // fallback
  }
  return mockReports;
}

export async function getReport(id: string): Promise<Report> {
  try {
    const numId = parseInt(id.replace('rep-', ''), 10) || 1;
    const r = await apiRequest<any>(`/api/reports/${numId}`, { method: 'GET' });
    return {
      id: String(r.id),
      run_id: String(r.research_run_id),
      competitor_id: String(r.competitor_id),
      competitor_name: r.competitor_name || `Competitor #${r.competitor_id}`,
      title: r.title,
      threat_score: r.threat_score ?? 70,
      executive_summary: r.executive_summary,
      major_developments: r.sections?.major_developments || [],
      product_intel: r.sections?.product_intelligence || [],
      pricing_intel: r.sections?.pricing_intelligence || [],
      financial_intel: r.sections?.financial_intelligence || [],
      news_intel: r.sections?.news_developments || [],
      strategic_moves: r.sections?.strategic_moves || [],
      risks: r.sections?.risks || [],
      opportunities: r.sections?.opportunities || [],
      threat_assessment: r.threat_explanation || '',
      strategic_implications: r.sections?.strategic_implications || '',
      sources: (r.sections?.sources_and_evidence || []).map((url: string, i: number) => ({
        id: `src-${i}`,
        run_id: String(r.research_run_id),
        url,
        title: url,
        source_type: 'website',
        credibility_score: 95,
        retrieved_at: r.created_at,
      })),
      created_at: r.created_at,
    };
  } catch {
    return mockReports.find((r) => r.id === id || r.run_id === id) || mockReports[0];
  }
}

// 5. Dashboard & System Settings
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const data = await apiRequest<any>('/api/dashboard', { method: 'GET' });
    if (data && typeof data === 'object') {
      return {
        total_competitors: data.total_competitors ?? 0,
        active_runs: data.active_runs ?? 0,
        total_reports: data.total_reports ?? 0,
        avg_threat_score: Math.round(data.avg_threat_score ?? data.average_threat_score ?? 68),
        threat_comparison: data.threat_comparison || [],
        recent_alerts: data.recent_alerts || [],
        recent_runs: (data.recent_runs || []).map((r: any) => ({
          id: String(r.id),
          competitor_id: String(r.competitor_id),
          competitor_name: r.competitor_name,
          query: r.query,
          status: r.status,
          started_at: r.started_at,
          completed_at: r.completed_at,
          agent_progress: r.agent_progress || {},
        })),
        activity_timeline: data.activity_timeline || [],
      };
    }
  } catch {
    // fallback
  }
  return {
    ...mockDashboardStats,
    recent_runs: dynamicRuns,
  };
}

export async function getSettings(): Promise<SettingsInfo> {
  return apiRequest<SettingsInfo>('/api/settings', { method: 'GET' }, mockSettings);
}

export async function updateSettings(data: Partial<SettingsInfo> & Record<string, any>): Promise<SettingsInfo> {
  return apiRequest<SettingsInfo>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function testComponentConnection(target: string): Promise<{ success: boolean; latency_ms: number; message: string }> {
  return apiRequest<{ success: boolean; latency_ms: number; message: string }>('/api/settings/test-connection', {
    method: 'POST',
    body: JSON.stringify({ target }),
  });
}

// 6. SSE Progress Subscription
export function subscribeToProgress(runId: string): EventSource | null {
  if (typeof window === 'undefined') return null;
  const numId = parseInt(runId.replace('run-', ''), 10) || runId;
  const url = `${API_BASE}/api/research/runs/${numId}/progress`;
  try {
    return new EventSource(url);
  } catch (err) {
    console.warn(`Unable to connect SSE stream at ${url}:`, err);
    return null;
  }
}
