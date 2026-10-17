'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Globe,
  Link2,
  Calendar,
  AlertTriangle,
  Trash2,
  ChevronRight,
  ExternalLink,
  Shield,
  Search,
  Zap,
  Loader2,
} from 'lucide-react';
import { fetchCompetitors, createCompetitor, deleteCompetitor, startResearchRun, getIsDemoFallbackActive } from '@/lib/api';
import { Competitor } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CompetitorForm } from '@/components/competitors/competitor-form';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

export default function CompetitorsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runningCompId, setRunningCompId] = useState<string | null>(null);

  const loadCompetitors = async () => {
    try {
      const data = await fetchCompetitors();
      setCompetitors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompetitors();
  }, []);

  const handleCreate = async (formData: Partial<Competitor>) => {
    setIsSubmitting(true);
    try {
      await createCompetitor(formData);
      toast.success('Competitor Registered', `${formData.name} added to autonomous monitoring.`);
      await loadCompetitors();
      setDialogOpen(false);
    } catch (err) {
      toast.error('Registration Failed', 'Could not create competitor record.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${name} from monitoring?`)) return;
    try {
      await deleteCompetitor(id);
      toast.info('Target Removed', `${name} removed from watchlist.`);
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      toast.error('Deletion Failed', 'Could not remove competitor.');
      console.error(err);
    }
  };

  const handleDirectRun = async (e: React.MouseEvent, comp: Competitor) => {
    e.preventDefault();
    e.stopPropagation();
    setRunningCompId(comp.id);
    try {
      const run = await startResearchRun(
        comp.id,
        `Comprehensive 30-day competitive audit and threat matrix scan for ${comp.name}`
      );
      toast.success('Analysis Dispatched', `Multi-agent fleet researching ${comp.name}.`);
      router.push(`/research/${run.id}`);
    } catch (err) {
      toast.error('Dispatch Failed', 'Could not start research execution.');
    } finally {
      setRunningCompId(null);
    }
  };

  const filteredCompetitors = competitors.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.industry && c.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getThreatBadge = (score: number) => {
    if (score >= 70) {
      return (
        <Badge variant="destructive" className="gap-1 font-semibold">
          <AlertTriangle className="h-3 w-3" /> Threat {score}/100
        </Badge>
      );
    }
    if (score >= 50) {
      return (
        <Badge variant="warning" className="gap-1 font-semibold">
          Threat {score}/100
        </Badge>
      );
    }
    return (
      <Badge variant="success" className="gap-1 font-semibold">
        Threat {score}/100
      </Badge>
    );
  };

  const isDemo = getIsDemoFallbackActive();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Monitored Competitors
            </h2>
            {isDemo && (
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px]">
                Demo Data
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Maintain watchlists, crawl targets, and active threat profiles across your sector.
          </p>
        </div>

        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Competitor</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70" />
          <input
            type="text"
            placeholder="Search by company name, sector, or market niche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-xl border border-input/70 bg-card/80 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          Showing {filteredCompetitors.length} targets
        </div>
      </div>

      {/* Competitors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredCompetitors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/30">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No Competitors Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'No companies match your search filter. Clear the query or add a new competitor.'
              : 'Add your primary market competitors to initiate autonomous monitoring.'}
          </p>
          <button
            onClick={() => setDialogOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Add First Competitor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompetitors.map((comp) => (
            <Link
              key={comp.id}
              href={`/competitors/${comp.id}`}
              className="glass-card group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/60 p-6 shadow-sm transition-all hover:border-primary/50"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-base">
                      {comp.name.substring(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors flex items-center gap-1.5">
                        {comp.name}
                        <ChevronRight className="h-4 w-4 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-primary" />
                      </h3>
                      <span className="text-xs text-muted-foreground font-medium">
                        {comp.industry || 'Technology'}
                      </span>
                    </div>
                  </div>
                  {getThreatBadge(comp.threat_score ?? 60)}
                </div>

                {/* Description */}
                {comp.description && (
                  <p className="text-xs text-muted-foreground/90 line-clamp-2 mb-4 leading-relaxed">
                    {comp.description}
                  </p>
                )}

                {/* Key metadata points */}
                <div className="space-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-slate-500" />
                      Domain
                    </span>
                    <span className="font-mono text-[11px] text-foreground truncate max-w-[140px]">
                      {comp.website?.replace(/^https?:\/\//, '') || 'domain.com'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5 text-slate-500" />
                      Monitored Feeds
                    </span>
                    <span className="font-semibold text-foreground">
                      {comp.monitoring_urls?.length ?? comp.url_count ?? 1} URLs
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      Last Analysis
                    </span>
                    <span className="text-[11px]">
                      {comp.last_analysis_at ? formatDate(comp.last_analysis_at) : 'Pending initial run'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3">
                <button
                  onClick={(e) => handleDirectRun(e, comp)}
                  disabled={runningCompId === comp.id}
                  className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 py-1 px-2 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                  title="Run Immediate Autonomous Scan"
                >
                  {runningCompId === comp.id ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3 w-3" />
                      <span>Run Analysis</span>
                    </>
                  )}
                </button>

                <button
                  onClick={(e) => handleDelete(e, comp.id, comp.name)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                  title="Remove target"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Competitor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Add Competitor Target
            </DialogTitle>
            <DialogDescription>
              Configure an enterprise profile for automated agent web crawlers and SEC analysis.
            </DialogDescription>
          </DialogHeader>

          <CompetitorForm
            onSubmit={handleCreate}
            onCancel={() => setDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
