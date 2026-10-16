'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  FlaskConical,
  FileText,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Clock,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Loader2,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { getDashboardStats, fetchCompetitors, startResearchRun, getIsDemoFallbackActive } from '@/lib/api';
import { DashboardStats, Competitor } from '@/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { formatDate, formatRelativeTime } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [dashData, comps] = await Promise.all([
          getDashboardStats(),
          fetchCompetitors(),
        ]);
        setStats(dashData);
        setCompetitors(comps);
        if (comps.length > 0) setSelectedCompId(comps[0].id);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompId) return;
    setIsSubmitting(true);
    try {
      const run = await startResearchRun(
        selectedCompId,
        query || 'Automated multi-agent threat assessment and competitive scan'
      );
      setDialogOpen(false);
      router.push(`/research/${run.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDemo = getIsDemoFallbackActive();

  return (
    <div className="space-y-6">
      {/* Top Welcome / Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-gradient-to-r from-card via-[#111827] to-card p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Competitive Intelligence Radar
            </h2>
            {isDemo && (
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[11px]">
                Demo Data Active
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Multi-agent orchestrator continuously synthesizing product deltas, pricing matrices, and 10-Q/K regulatory filings.
          </p>
        </div>

        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all shrink-0"
        >
          <Sparkles className="h-4 w-4" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* 4 Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Monitored Targets"
            value={stats?.total_competitors ?? 0}
            change="+2 this month"
            changeType="positive"
            icon={Building2}
            description="Active competitor profiles under automated tracking"
          />
          <StatsCard
            title="Active Agent Runs"
            value={stats?.active_runs ?? 0}
            change="Real-time"
            changeType="positive"
            icon={FlaskConical}
            description="Autonomous multi-agent pipelines currently executing"
          />
          <StatsCard
            title="Verified Dossiers"
            value={stats?.total_reports ?? 0}
            change="+4 this week"
            changeType="positive"
            icon={FileText}
            description="Executive synthesis reports with cross-audited claims"
          />
          <StatsCard
            title="Average Threat Score"
            value={`${stats?.avg_threat_score ?? 64}/100`}
            change="Elevated"
            changeType="negative"
            icon={AlertTriangle}
            description="Composite competitive friction across landscape"
          />
        </div>
      )}

      {/* Mid Section: Threat Comparison Chart & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Comparison Chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Competitor Threat Index Comparison
                </h3>
                <p className="text-xs text-muted-foreground">
                  Computed 0-100 severity index derived from feature releases and market aggression
                </p>
              </div>
            </div>
            <Link
              href="/competitors"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              All Targets <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.threat_comparison || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey="competitor"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      borderColor: '#374151',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value} / 100`, 'Threat Score']}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {(stats?.threat_comparison || []).map((entry, index) => {
                      const color =
                        entry.score > 70
                          ? '#ef4444'
                          : entry.score > 50
                          ? '#f59e0b'
                          : '#10b981';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Alerts / Changes */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-semibold text-foreground">
                  Recent Threat Signals
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Live Feed
              </Badge>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(stats?.recent_alerts || []).map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-lg border border-border/70 bg-card/50 p-3 hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-foreground">
                        {alert.competitor}
                      </span>
                      <span className="text-muted-foreground">{alert.time}</span>
                    </div>
                    <p className="text-xs text-foreground/90 leading-tight">
                      {alert.title}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          alert.type === 'critical'
                            ? 'bg-rose-500'
                            : alert.type === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                        {alert.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/news"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card/60 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <span>View Full Market Feed</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Bottom Section: Recent Research Runs & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Research Runs Table */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Recent Research Runs
                </h3>
                <p className="text-xs text-muted-foreground">
                  Multi-agent orchestration executions and live pipeline statuses
                </p>
              </div>
            </div>
            <Link
              href="/research"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              All Runs <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground">
                    <th className="pb-3 font-semibold">Competitor</th>
                    <th className="pb-3 font-semibold">Scope / Query</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Started</th>
                    <th className="pb-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {(stats?.recent_runs || []).map((run) => (
                    <tr key={run.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3.5 font-semibold text-foreground">
                        {run.competitor_name || 'Target'}
                      </td>
                      <td className="py-3.5 text-muted-foreground max-w-xs truncate pr-3">
                        {run.query}
                      </td>
                      <td className="py-3.5">
                        {run.status === 'completed' ? (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </Badge>
                        ) : run.status === 'running' ? (
                          <Badge variant="info" className="gap-1 animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" /> Running
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{run.status}</Badge>
                        )}
                      </td>
                      <td className="py-3.5 text-muted-foreground font-mono">
                        {formatRelativeTime(run.started_at)}
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          href={`/research/${run.id}`}
                          className="inline-flex items-center gap-1 rounded px-2.5 py-1 font-medium text-primary hover:bg-primary/10 transition-colors"
                        >
                          Inspect <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Orchestrator Activity Log
            </h3>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="relative pl-4 space-y-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
              {(stats?.activity_timeline || []).map((item) => (
                <div key={item.id} className="relative text-xs">
                  <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-[#090d16]" />
                  <div className="flex items-center justify-between text-muted-foreground text-[11px] mb-0.5">
                    <span className="font-semibold text-primary">{item.actor}</span>
                    <span>{item.time}</span>
                  </div>
                  <p className="text-foreground/90">
                    {item.action}{' '}
                    <span className="font-semibold text-foreground">{item.target}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Launch Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleStartAnalysis}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Sparkles className="h-4 w-4 text-primary" />
                Dispatch Autonomous Competitive Intelligence Run
              </DialogTitle>
              <DialogDescription>
                Spawn the 7-agent cluster to gather evidence, extract pricing deltas, and cross-examine claims.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Select Competitor Target
                </label>
                <Select
                  value={selectedCompId}
                  onChange={(e) => setSelectedCompId(e.target.value)}
                  required
                >
                  {competitors.map((c) => (
                    <option key={c.id} value={c.id} className="bg-card text-foreground">
                      {c.name} ({c.industry})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Investigation Focus / Query
                </label>
                <Textarea
                  placeholder="e.g. Audit new Q3 tier pricing changes, API token charges, and security acquisitions..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? 'Spawning Agents...' : 'Execute Analysis'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
