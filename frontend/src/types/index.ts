export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AgentProgress {
  agent_id: string;
  name: string;
  status: AgentStatus;
  message?: string;
  start_time?: string;
  end_time?: string;
  elapsed_seconds?: number;
}

export interface Competitor {
  id: string;
  name: string;
  industry: string;
  website: string;
  monitoring_urls?: string[];
  description?: string;
  threat_score: number;
  created_at: string;
  updated_at?: string;
  last_analysis_at?: string;
  url_count?: number;
}

export interface ResearchRun {
  id: string;
  competitor_id: string;
  competitor_name?: string;
  query: string;
  status: AgentStatus;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  error_message?: string;
  current_agent?: string;
  progress_summary?: string;
  agent_progress?: Record<string, AgentProgress>;
}

export type SourceType = 'website' | 'news' | 'pricing' | 'financial' | 'sec_filing';

export interface Source {
  id: string;
  run_id: string;
  url: string;
  title: string;
  snippet?: string;
  source_type: SourceType;
  credibility_score: number;
  retrieved_at: string;
  competitor_name?: string;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type EvidenceType = 'verified_fact' | 'retrieved_info' | 'ai_interpretation';

export interface Finding {
  id: string;
  run_id: string;
  competitor_id: string;
  competitor_name?: string;
  category: 'product' | 'pricing' | 'financial' | 'news' | 'strategic';
  title: string;
  summary: string;
  confidence: ConfidenceLevel;
  evidence_type: EvidenceType;
  sources: string[];
  created_at: string;
}

export interface ProductIntel {
  id: string;
  competitor_id: string;
  competitor_name: string;
  product_name: string;
  change_type: 'launch' | 'update' | 'deprecation' | 'feature';
  description: string;
  impact?: 'high' | 'medium' | 'low';
  detected_at: string;
  source_url?: string;
}

export interface PricingIntel {
  id: string;
  competitor_id: string;
  competitor_name: string;
  product_name: string;
  pricing_model: string;
  tier_details: string;
  change_description?: string;
  previous_price?: string;
  current_price?: string;
  detected_at: string;
  source_url?: string;
}

export interface NewsItem {
  id: string;
  competitor_id: string;
  competitor_name: string;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  published_at: string;
  category: string;
}

export interface Claim {
  id: string;
  run_id: string;
  claim_text: string;
  verification_status: 'verified' | 'unverified' | 'refuted' | 'partial';
  confidence: number;
  supporting_evidence?: string;
  contradiction_reason?: string;
}

export interface Conflict {
  id: string;
  run_id: string;
  statement_a: string;
  statement_b: string;
  source_a: string;
  source_b: string;
  resolution_summary?: string;
  status: 'resolved' | 'unresolved' | 'flagged';
}

export interface ReportRisk {
  title: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  mitigation?: string;
}

export interface ReportOpportunity {
  title: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  timeframe?: string;
}

export interface Report {
  id: string;
  run_id: string;
  competitor_id: string;
  competitor_name: string;
  title: string;
  threat_score: number;
  executive_summary: string;
  major_developments: string[];
  product_intel: string[];
  pricing_intel: string[];
  financial_intel: string[];
  news_intel: string[];
  strategic_moves: string[];
  risks: ReportRisk[];
  opportunities: ReportOpportunity[];
  threat_assessment: string;
  strategic_implications: string;
  sources: Source[];
  confidence_distribution?: {
    high: number;
    medium: number;
    low: number;
  };
  category_breakdown?: {
    name: string;
    count: number;
  }[];
  created_at: string;
}

export interface DashboardStats {
  total_competitors: number;
  active_runs: number;
  total_reports: number;
  avg_threat_score: number;
  recent_runs: ResearchRun[];
  threat_comparison: {
    competitor: string;
    score: number;
    previousScore?: number;
  }[];
  recent_alerts: {
    id: string;
    competitor: string;
    title: string;
    type: 'critical' | 'warning' | 'info';
    time: string;
  }[];
  activity_timeline: {
    id: string;
    time: string;
    actor: string;
    action: string;
    target: string;
  }[];
}

export interface SettingsInfo {
  demo_mode: boolean;
  llm_provider: string;
  llm_model: string;
  postgres_connected: boolean;
  pinecone_connected: boolean;
  env_status: {
    DATABASE_URL: boolean;
    LLM_API_KEY: boolean;
    PINECONE_API_KEY: boolean;
    NEWS_API_KEY: boolean;
  };
}
