'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Globe,
  Tag,
  TrendingUp,
  Newspaper,
  ShieldCheck,
  FileCheck,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  AlertCircle,
  HelpCircle,
  XCircle,
  Layers,
  Sparkles,
  Search,
  Copy,
  Download,
  Filter,
  Activity,
  Check,
} from 'lucide-react';
import {
  getResearchRun,
  getRunSources,
  getRunFindings,
  getRunClaims,
  getRunConflicts,
  getReport,
  subscribeToProgress,
  getIsDemoFallbackActive,
} from '@/lib/api';
import {
  ResearchRun,
  Source,
  Finding,
  Claim,
  Conflict,
  Report,
  AgentProgress,
} from '@/types';
import { AgentPipeline } from '@/components/research/agent-pipeline';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { ThreatGauge } from '@/components/reports/threat-gauge';
import { useToast } from '@/components/ui/toast';

export default function ResearchRunDetailPage() {
  const params = useParams();
  const runId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { toast } = useToast();

  const [run, setRun] = useState<ResearchRun | null>(null);
  const [agentProgress, setAgentProgress] = useState<Record<string, AgentProgress>>({});
  const [sources, setSources] = useState<Source[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sources');

  // Interactive filters
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!runId) return;

    let eventSource: EventSource | null = null;

    async function loadData() {
      try {
        const runData = await getResearchRun(runId);
        setRun(runData);
        setAgentProgress(runData.agent_progress || {});

        const [srcs, fnds, clms, cnflcts, rep] = await Promise.all([
          getRunSources(runId),
          getRunFindings(runId),
          getRunClaims(runId),
          getRunConflicts(runId),
          getReport(runId),
        ]);

        setSources(srcs);
        setFindings(fnds);
        setClaims(clms);
        setConflicts(cnflcts);
        setReport(rep);
      } catch (err) {
        console.error('Error fetching run details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Hook into SSE stream for live progress updates
    try {
      eventSource = subscribeToProgress(runId);
      if (eventSource) {
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.agent_progress) {
              setAgentProgress(data.agent_progress);
            }
            if (data.agent && data.status) {
              setAgentProgress((prev) => ({
                ...prev,
                [data.agent]: {
                  agent_id: data.agent,
                  name: data.agent.replace('_', ' ').toUpperCase(),
                  status: data.status,
                  message: data.message,
                },
              }));
            }
            if (data.status) {
              setRun((prev) => (prev ? { ...prev, status: data.status, current_agent: data.agent || prev.current_agent } : null));
            }
            if (data.event === 'run_completed' || data.report) {
              loadData();
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e);
          }
        };
        eventSource.onerror = () => {
          eventSource?.close();
        };
      }
    } catch (e) {
      console.warn('SSE subscription skipped or unsupported');
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [runId]);

  // Export dossier handler
  const handleCopyDossier = () => {
    const payload = {
      run_id: run?.id,
      competitor: run?.competitor_name,
      query: run?.query,
      sources_count: sources.length,
      findings_count: findings.length,
      claims_count: claims.length,
      threat_score: report?.threat_score,
      executive_summary: report?.executive_summary,
      findings: findings.map((f) => ({ title: f.title, category: f.category, summary: f.summary, confidence: f.confidence })),
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    toast.success('Dossier Copied', 'All verified findings and executive summaries copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const payload = {
      run,
      report,
      findings,
      sources,
      claims,
      conflicts,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intelligence-dossier-${runId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.info('Export Started', 'Downloaded complete JSON dossier.');
  };

  // Filtered views
  const filteredSources = useMemo(() => {
    return sources.filter((s) =>
      s.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.url?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.source_type?.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [sources, searchFilter]);

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchesSearch =
        f.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        f.summary?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        f.category?.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesCat = categoryFilter === 'all' || f.category?.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesCat;
    });
  }, [findings, searchFilter, categoryFilter]);

  const filteredClaims = useMemo(() => {
    return claims.filter((c) =>
      c.claim_text?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.verification_status?.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [claims, searchFilter]);

  const getClaimBadge = (status: Claim['verification_status']) => {
    switch (status) {
      case 'verified':
        return (
          <Badge variant="success" className="gap-1 font-semibold">
            <CheckCircle2 className="h-3 w-3" /> Verified
          </Badge>
        );
      case 'refuted':
        return (
          <Badge variant="destructive" className="gap-1 font-semibold">
            <XCircle className="h-3 w-3" /> Refuted
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="warning" className="gap-1 font-semibold">
            <HelpCircle className="h-3 w-3" /> Partial
          </Badge>
        );
      case 'unverified':
      default:
        return (
          <Badge variant="secondary" className="gap-1 font-semibold">
            <Clock className="h-3 w-3" /> Unverified
          </Badge>
        );
    }
  };

  const getSourceTypeBadge = (type: Source['source_type']) => {
    switch (type) {
      case 'website':
        return <Badge variant="info">Website</Badge>;
      case 'pricing':
        return <Badge variant="warning">Pricing Page</Badge>;
      case 'sec_filing':
        return <Badge variant="purple">SEC Form 10-Q</Badge>;
      case 'financial':
        return <Badge variant="success">Financials</Badge>;
      case 'news':
        return <Badge variant="default">Press / News</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const isDemo = getIsDemoFallbackActive();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
        <h3 className="text-base font-semibold text-foreground">Research Run Not Found</h3>
        <Link href="/research" className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Research Runs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/research"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Research Executions
        </Link>

        <div className="flex items-center gap-2">
          {/* Live SSE Pulse */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/80 bg-card/60 text-[11px] text-muted-foreground font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>SSE Telemetry Active</span>
          </div>

          {isDemo && (
            <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px]">
              Demo Stream
            </Badge>
          )}
          <Badge variant="outline" className="font-mono text-xs">
            Run ID: #{run.id}
          </Badge>
        </div>
      </div>

      {/* Target & Query Briefing Card */}
      <div className="rounded-2xl border border-border/70 bg-gradient-to-r from-card via-[#0e1424] to-card p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Target Organization:
              </span>
              <span className="text-lg font-bold text-foreground">
                {run.competitor_name || 'Target'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight max-w-3xl">
              {run.query}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              <span>Initiated: {formatDate(run.started_at)}</span>
              {run.duration_seconds && (
                <span>Duration: {run.duration_seconds}s</span>
              )}
              <span className="font-mono text-emerald-400">
                Status: {run.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Export Actions */}
            <button
              onClick={handleCopyDossier}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/80 bg-card/80 hover:bg-card hover:border-primary/50 text-xs text-foreground font-medium transition-all"
              title="Copy Summary to Clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              <span>{copied ? 'Copied!' : 'Copy Dossier'}</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/80 bg-card/80 hover:bg-card hover:border-primary/50 text-xs text-foreground font-medium transition-all"
              title="Download Full JSON"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Export JSON</span>
            </button>

            {run.status === 'completed' && report && (
              <Link
                href={`/reports/${report.id}`}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 transition-all"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Open Executive Dossier</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* AGENT PIPELINE PROGRESS (SHOWCASE) */}
      <AgentPipeline
        agentProgress={agentProgress}
        currentAgent={run.current_agent || (run.status === 'completed' ? 'Synthesis Finished' : 'Active Multi-Agent Orchestrator')}
      />

      {/* Interactive Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border border-border/60 bg-card/40">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70" />
          <input
            type="text"
            placeholder="Search findings, claims, source URLs..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="h-9 w-full rounded-xl border border-input/70 bg-card/80 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {activeTab === 'findings' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'product', 'pricing', 'financial', 'news', 'strategic'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-[11px] font-medium capitalize px-2.5 py-1 rounded-lg border transition-all shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Tabs */}
      <Tabs defaultValue="sources" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto bg-[#0a0f1d] border border-border/70 p-1 rounded-xl">
          <TabsTrigger value="sources" className="text-xs">
            Discovered Sources ({filteredSources.length})
          </TabsTrigger>
          <TabsTrigger value="findings" className="text-xs">
            Categorized Findings ({filteredFindings.length})
          </TabsTrigger>
          <TabsTrigger value="claims" className="text-xs">
            Claims & Verification ({filteredClaims.length})
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="text-xs">
            Conflict Resolutions ({conflicts.length})
          </TabsTrigger>
          <TabsTrigger value="report" className="text-xs">
            Executive Report {report ? '✓' : '(Compiling)'}
          </TabsTrigger>
        </TabsList>

        {/* 1. Sources Tab */}
        <TabsContent value="sources">
          <div className="rounded-2xl border border-border/70 bg-card/60 overflow-hidden shadow-sm backdrop-blur-sm">
            <div className="p-4 border-b border-border/80 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Audited Intelligence Sources
                </h4>
                <p className="text-xs text-muted-foreground">
                  Web domains, changelogs, SEC filings, and pricing schedules crawled by agents
                </p>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {filteredSources.length} of {sources.length} Sources
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground">
                  <tr>
                    <th className="p-3.5 font-semibold">Source Title / URL</th>
                    <th className="p-3.5 font-semibold">Type</th>
                    <th className="p-3.5 font-semibold">Credibility Score</th>
                    <th className="p-3.5 font-semibold">Snippet</th>
                    <th className="p-3.5 text-right font-semibold">Retrieved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredSources.map((src) => (
                    <tr key={src.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="p-3.5 max-w-xs">
                        <div className="font-semibold text-foreground line-clamp-1">
                          {src.title}
                        </div>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline truncate max-w-[280px]"
                        >
                          <Globe className="h-3 w-3 shrink-0" />
                          <span className="truncate">{src.url}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </a>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {getSourceTypeBadge(src.source_type)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground">
                            {src.credibility_score}%
                          </span>
                          <div className="h-1.5 w-14 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${src.credibility_score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-muted-foreground max-w-sm line-clamp-2">
                        {src.snippet || 'No excerpt recorded.'}
                      </td>
                      <td className="p-3.5 font-mono text-muted-foreground text-right whitespace-nowrap">
                        {formatRelativeTime(src.retrieved_at)}
                      </td>
                    </tr>
                  ))}
                  {filteredSources.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">
                        No sources match your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* 2. Findings Tab */}
        <TabsContent value="findings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFindings.map((finding) => (
              <div
                key={finding.id}
                className="glass-card rounded-2xl border border-border/80 bg-card/60 p-5 space-y-3 shadow-sm hover:border-primary/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="capitalize text-xs font-semibold">
                    {finding.category} Intel
                  </Badge>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        finding.evidence_type === 'verified_fact'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : finding.evidence_type === 'retrieved_info'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {finding.evidence_type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {finding.confidence.toUpperCase()} CONFIDENCE
                    </span>
                  </div>
                </div>

                <h4 className="text-base font-semibold text-foreground">
                  {finding.title}
                </h4>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {finding.summary}
                </p>

                {finding.sources && finding.sources.length > 0 && (
                  <div className="border-t border-border/60 pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Evidence Links: {finding.sources.length} sources</span>
                    <span className="font-mono text-slate-500">{formatDate(finding.created_at)}</span>
                  </div>
                )}
              </div>
            ))}
            {filteredFindings.length === 0 && (
              <div className="col-span-2 p-12 text-center rounded-2xl border border-border bg-card/50 text-xs text-muted-foreground">
                No findings match your filter criteria.
              </div>
            )}
          </div>
        </TabsContent>

        {/* 3. Claims & Verification Tab */}
        <TabsContent value="claims">
          <div className="rounded-2xl border border-border/70 bg-card/60 overflow-hidden shadow-sm backdrop-blur-sm">
            <div className="p-4 border-b border-border/80 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Audited Market Claims & Fact Verification
                </h4>
                <p className="text-xs text-muted-foreground">
                  Verification Agent cross-referenced claims with authoritative SEC disclosures and technical docs
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {filteredClaims.length} Claims Assessed
              </Badge>
            </div>

            <div className="divide-y divide-border/60">
              {filteredClaims.map((claim) => (
                <div key={claim.id} className="p-5 space-y-2 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-medium text-foreground">
                      &ldquo;{claim.claim_text}&rdquo;
                    </p>
                    {getClaimBadge(claim.verification_status)}
                  </div>

                  {claim.supporting_evidence && (
                    <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/20 p-3 text-xs text-emerald-300">
                      <span className="font-semibold block mb-0.5">Supporting Ground Truth:</span>
                      {claim.supporting_evidence}
                    </div>
                  )}

                  {claim.contradiction_reason && (
                    <div className="rounded-xl bg-rose-950/20 border border-rose-500/20 p-3 text-xs text-rose-300">
                      <span className="font-semibold block mb-0.5">Contradiction / Audit Defect:</span>
                      {claim.contradiction_reason}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Audit Confidence: {Math.round(claim.confidence * 100)}%</span>
                  </div>
                </div>
              ))}
              {filteredClaims.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No claims match the filter criteria.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* 4. Conflicts Tab */}
        <TabsContent value="conflicts">
          <div className="space-y-4">
            {conflicts.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-border/70 bg-card/60 text-xs text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                No unresolved source contradictions detected during this orchestration run. All cross-agent claims reconciled cleanly.
              </div>
            ) : (
              conflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                      Source Discrepancy #{conflict.id}
                    </Badge>
                    <Badge variant="success">Status: {conflict.status}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-secondary/40 p-3.5 border border-border/70 text-xs space-y-1">
                      <span className="text-[10px] uppercase font-mono text-muted-foreground block font-bold">
                        Statement A:
                      </span>
                      <p className="text-foreground">{conflict.statement_a}</p>
                      <span className="text-[10px] text-slate-500 block truncate">
                        Source: {conflict.source_a}
                      </span>
                    </div>

                    <div className="rounded-xl bg-secondary/40 p-3.5 border border-border/70 text-xs space-y-1">
                      <span className="text-[10px] uppercase font-mono text-muted-foreground block font-bold">
                        Statement B:
                      </span>
                      <p className="text-foreground">{conflict.statement_b}</p>
                      <span className="text-[10px] text-slate-500 block truncate">
                        Source: {conflict.source_b}
                      </span>
                    </div>
                  </div>

                  {conflict.resolution_summary && (
                    <div className="rounded-xl bg-primary/10 border border-primary/20 p-3.5 text-xs text-primary-foreground">
                      <span className="font-semibold block mb-0.5 text-primary">
                        Autonomous Conflict Resolution:
                      </span>
                      <p className="text-foreground/90">{conflict.resolution_summary}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* 5. Report Tab */}
        <TabsContent value="report">
          {report ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/60 p-4 backdrop-blur-sm">
                <div>
                  <h4 className="text-base font-bold text-foreground">
                    {report.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Generated by Executive Synthesis Agent on {formatDate(report.created_at)}
                  </p>
                </div>
                <Link
                  href={`/reports/${report.id}`}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Full Screen Dossier</span>
                </Link>
              </div>

              {/* Executive Summary & Threat score */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card/60 p-6 shadow-sm space-y-4">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                      Executive Summary
                    </h5>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {report.executive_summary}
                    </p>
                  </div>

                  {report.major_developments && report.major_developments.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                        Major Developments
                      </h5>
                      <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground">
                        {report.major_developments.map((dev, idx) => (
                          <li key={idx} className="text-foreground/80 leading-relaxed">
                            {dev}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-border/80 bg-card/60 p-6 shadow-sm flex flex-col items-center justify-center">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                    Threat Assessment Score
                  </h5>
                  <ThreatGauge score={report.threat_score} size={150} />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/70 bg-card/50 p-12 text-center text-xs text-muted-foreground">
              Synthesis Agent is currently running. Report will be generated upon completion of all verification checks.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
