'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FlaskConical,
  Plus,
  Search,
  CheckCircle2,
  Loader2,
  Clock,
  AlertCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { getResearchRuns, fetchCompetitors, startResearchRun, getIsDemoFallbackActive } from '@/lib/api';
import { ResearchRun, Competitor } from '@/types';
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

export default function ResearchRunsPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [runsData, comps] = await Promise.all([
        getResearchRuns(),
        fetchCompetitors(),
      ]);
      setRuns(runsData);
      setCompetitors(comps);
      if (comps.length > 0) setSelectedCompId(comps[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompId) return;
    setIsSubmitting(true);
    try {
      const run = await startResearchRun(
        selectedCompId,
        query || 'Cross-vector competitive intelligence inquiry'
      );
      setDialogOpen(false);
      router.push(`/research/${run.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRuns = runs.filter((r) => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch =
      (r.competitor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.query.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="success" className="gap-1.5 font-medium">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="info" className="gap-1.5 font-semibold animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" /> Running
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1.5 font-medium">
            <AlertCircle className="h-3 w-3" /> Failed
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="secondary" className="gap-1.5 font-medium">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
    }
  };

  const isDemo = getIsDemoFallbackActive();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Autonomous Research Runs
            </h2>
            {isDemo && (
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px]">
                Demo Mode
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time multi-agent execution pipeline: Planner, Web, Products, Financial RAG, News, Verification, and Synthesis.
          </p>
        </div>

        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Launch Research Run</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search query, keyword or target organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-card/60 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-36 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </Select>
        </div>
      </div>

      {/* Runs Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No research runs matched your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground">
                <tr>
                  <th className="p-4 font-semibold">Competitor</th>
                  <th className="p-4 font-semibold">Query / Objective</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Started</th>
                  <th className="p-4 font-semibold">Duration</th>
                  <th className="p-4 text-right font-semibold">Pipeline Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRuns.map((run) => (
                  <tr
                    key={run.id}
                    onClick={() => router.push(`/research/${run.id}`)}
                    className="cursor-pointer hover:bg-secondary/40 transition-colors group"
                  >
                    <td className="p-4 font-bold text-foreground whitespace-nowrap">
                      {run.competitor_name || 'Competitor'}
                    </td>
                    <td className="p-4 text-muted-foreground max-w-md truncate">
                      <span className="text-foreground/90 font-medium">{run.query}</span>
                      {run.progress_summary && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {run.progress_summary}
                        </p>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {getStatusBadge(run.status)}
                    </td>
                    <td className="p-4 text-muted-foreground font-mono whitespace-nowrap">
                      {formatRelativeTime(run.started_at)}
                    </td>
                    <td className="p-4 font-mono text-muted-foreground whitespace-nowrap">
                      {run.duration_seconds ? `${run.duration_seconds}s` : 'Active'}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:underline">
                        Live Pipeline <ArrowRight className="h-3 w-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Run Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleStartAnalysis}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                Launch Multi-Agent Research Execution
              </DialogTitle>
              <DialogDescription>
                Execute an autonomous research cycle against live web domains and SEC vector embeddings.
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
                  Research Prompt / Focus
                </label>
                <Textarea
                  placeholder="e.g. Analyze pricing plan restructuring and enterprise LLM integrations..."
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
                {isSubmitting ? 'Starting Run...' : 'Launch Agents'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
