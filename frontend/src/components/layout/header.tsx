'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, PlusCircle, Sparkles, Activity, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { fetchCompetitors, startResearchRun } from '@/lib/api';
import { Competitor } from '@/types';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [researchQuery, setResearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCompetitors()
      .then((comps) => {
        setCompetitors(comps);
        if (comps.length > 0) setSelectedCompId(comps[0].id);
      })
      .catch(() => {});
  }, []);

  const getPageTitle = (path: string): { title: string; subtitle: string } => {
    if (path === '/') return { title: 'Executive Intelligence Dashboard', subtitle: 'Global competitive landscape & automated agent signals' };
    if (path.startsWith('/competitors/')) return { title: 'Competitor Intelligence Dossier', subtitle: 'Target profile, pricing moves & multi-source telemetry' };
    if (path === '/competitors') return { title: 'Monitored Competitors', subtitle: 'Target organizations, watchlists and crawling profiles' };
    if (path.startsWith('/research/')) return { title: 'Autonomous Research Pipeline', subtitle: 'Multi-agent orchestration, source verification & conflict resolution' };
    if (path === '/research') return { title: 'Research Executions', subtitle: 'Historical and live agent orchestration runs' };
    if (path === '/products') return { title: 'Product & Feature Delta', subtitle: 'Reverse-engineered changelogs, feature drops & SDK tracking' };
    if (path === '/pricing') return { title: 'Pricing & Monetization Intel', subtitle: 'Tier shifts, usage-based rates and discount matrix tracking' };
    if (path === '/financial') return { title: 'Financial & SEC Intelligence', subtitle: 'Vector RAG over 10-K, 10-Q, transcript filings and revenue metrics' };
    if (path === '/news') return { title: 'Market News & Sentiment', subtitle: 'Streaming news aggregation with automated threat sentiment' };
    if (path.startsWith('/reports/')) return { title: 'Strategic Intelligence Report', subtitle: 'Verified executive briefing, threat scoring and risk mitigations' };
    if (path === '/reports') return { title: 'Intelligence Reports', subtitle: 'Archived executive briefings and threat assessments' };
    if (path === '/sources') return { title: 'Evidence & Source Registry', subtitle: 'Audited source URLs, SEC filings, and credibility scores' };
    if (path === '/settings') return { title: 'System & Engine Settings', subtitle: 'LLM providers, vector indexing, and pipeline credentials' };
    return { title: 'Competitive Intelligence', subtitle: 'Autonomous multi-agent research' };
  };

  const { title, subtitle } = getPageTitle(pathname);

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompId) return;
    setIsSubmitting(true);
    try {
      const run = await startResearchRun(
        selectedCompId,
        researchQuery || 'Comprehensive competitive analysis across product, pricing, and 10-Q filings'
      );
      setDialogOpen(false);
      setResearchQuery('');
      router.push(`/research/${run.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-[#090d16]/90 px-6 backdrop-blur supports-[backdrop-filter]:bg-[#090d16]/80">
        <div className="flex flex-col pl-10 lg:pl-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              {title}
            </h1>
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-mono border-border/80 text-muted-foreground">
              v1.0-ENTERPRISE
            </Badge>
          </div>
          <p className="hidden md:block text-xs text-muted-foreground truncate max-w-xl">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick search */}
          <div className="relative hidden md:block w-48 lg:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Filter findings, tickers..."
              className="h-9 w-full rounded-md border border-input bg-card/60 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* New Analysis Action Button */}
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>New Analysis</span>
          </button>
        </div>
      </header>

      {/* New Analysis Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleStartAnalysis}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Sparkles className="h-4 w-4 text-primary" />
                Launch Multi-Agent Intelligence Run
              </DialogTitle>
              <DialogDescription>
                Orchestrate 7 autonomous agents across search, SEC filings, product logs, and verification pipelines.
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
                  Investigation Query / Scope
                </label>
                <Textarea
                  placeholder="e.g. Audit recent pricing changes, LLM feature releases, and Q3 SEC risk disclosures..."
                  value={researchQuery}
                  onChange={(e) => setResearchQuery(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="rounded-md bg-secondary/50 p-2.5 border border-border/60 text-[11px] text-muted-foreground flex items-start gap-2">
                <Activity className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  The Planner Agent will formulate sub-tasks, delegate web harvesting, execute Pinecone financial RAG, cross-examine claims, and compile an executive report.
                </span>
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
                className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? 'Dispatching Agents...' : 'Start Autonomous Run'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
