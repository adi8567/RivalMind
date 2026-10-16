'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { fetchCompetitors, createCompetitor, deleteCompetitor, getIsDemoFallbackActive } from '@/lib/api';
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

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await loadCompetitors();
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this competitor from monitoring?')) return;
    try {
      await deleteCompetitor(id);
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCompetitors = competitors.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getThreatBadge = (score: number) => {
    if (score >= 70) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" /> Threat {score}/100
        </Badge>
      );
    }
    if (score >= 50) {
      return (
        <Badge variant="warning" className="gap-1">
          Threat {score}/100
        </Badge>
      );
    }
    return (
      <Badge variant="success" className="gap-1">
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
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Competitor</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by company name, sector, or market niche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-card/60 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredCompetitors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card/30">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No Competitors Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'No companies match your search filter. Clear the query or add a new competitor.'
              : 'Add your primary market competitors to initiate autonomous monitoring.'}
          </p>
          <button
            onClick={() => setDialogOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
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
              className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors flex items-center gap-1.5">
                      {comp.name}
                      <ChevronRight className="h-4 w-4 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-primary" />
                    </h3>
                    <span className="text-xs text-muted-foreground font-medium">
                      {comp.industry}
                    </span>
                  </div>
                  {getThreatBadge(comp.threat_score)}
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
                      {comp.website.replace(/^https?:\/\//, '')}
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
                <span className="text-xs font-semibold text-primary flex items-center gap-1">
                  View Dossier
                </span>

                <button
                  onClick={(e) => handleDelete(e, comp.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
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
