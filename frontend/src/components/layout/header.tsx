'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  PlusCircle,
  Sparkles,
  Activity,
  Layers,
  Command,
  Zap,
} from 'lucide-react';
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
import Link from 'next/link';
import { fetchCompetitors, startResearchRun, getSettings } from '@/lib/api';
import { Competitor } from '@/types';
import { CommandPalette } from '@/components/layout/command-palette';
import { useToast } from '@/components/ui/toast';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [researchQuery, setResearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    fetchCompetitors()
      .then((comps) => {
        setCompetitors(comps);
        if (comps.length > 0) setSelectedCompId(comps[0].id);
      })
      .catch(() => {});

    getSettings()
      .then((s) => setIsDemoMode(s.demo_mode))
      .catch(() => {});
  }, [pathname]);

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
      const selectedComp = competitors.find((c) => c.id === selectedCompId);
      const run = await startResearchRun(
        selectedCompId,
        researchQuery || `Comprehensive multi-agent intelligence scan for ${selectedComp?.name || 'target'}`
      );
      toast.success(
        'Research Pipeline Dispatched',
        `Autonomous agents coordinating for ${selectedComp?.name || 'target'}.`
      );
      setDialogOpen(false);
      setResearchQuery('');
      router.push(`/research/${run.id}`);
    } catch (err) {
      toast.error('Dispatch Failed', 'Could not initialize research execution run.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/70 bg-[#070b14]/90 px-6 backdrop-blur-md">
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
          {/* Quick search command button */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center justify-between gap-3 h-9 px-3 w-48 lg:w-64 rounded-xl border border-input/70 bg-card/40 hover:bg-card hover:border-primary/40 text-xs text-muted-foreground transition-all group"
            title="Press Cmd+K to open search"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="truncate">Search or jump to...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-mono bg-card border border-border text-muted-foreground">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>

          {/* Mode Pill Indicator */}
          <Link href="/settings" title="Click to configure operating mode in Settings">
            {isDemoMode ? (
              <Badge variant="outline" className="text-[11px] border-amber-500/30 text-amber-400 bg-amber-500/10 cursor-pointer hover:bg-amber-500/20 transition-all">
                🟡 Demo Mode
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[11px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10 cursor-pointer hover:bg-emerald-500/20 transition-all flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                🟢 Live Mode
              </Badge>
            )}
          </Link>

          {/* New Analysis Action Button */}
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>New Analysis</span>
          </button>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenNewAnalysis={() => setDialogOpen(true)}
      />

      {/* New Analysis Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleStartAnalysis}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Launch Competitive Analysis
              </DialogTitle>
              <DialogDescription>
                Dispatches the 7-agent autonomous orchestrator to perform web research, financial RAG, pricing checks, news synthesis, and claim verification.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Target Competitor
                </label>
                <Select
                  value={selectedCompId}
                  onChange={(e) => setSelectedCompId(e.target.value)}
                >
                  {competitors.map((c) => (
                    <option key={c.id} value={c.id} className="bg-card text-foreground">
                      {c.name} ({c.industry || 'Technology'})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Custom Strategic Prompt (Optional)
                </label>
                <Textarea
                  placeholder="e.g. Focus on pricing changes in enterprise cloud tier and latest Q3 revenue guidance..."
                  value={researchQuery}
                  onChange={(e) => setResearchQuery(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              {/* Quick Prompt Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  Or select strategic prompt preset:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Full 30-Day Competitive Threat Audit',
                    'Pricing & Tier Rebundling Scan',
                    'Financial 10-Q & Revenue RAG Audit',
                    'Product Feature Delta & Launch Tracking',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setResearchQuery(preset)}
                      className="text-[10px] px-2.5 py-1 rounded-lg border border-border/80 bg-card/60 hover:bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !selectedCompId}
                className="gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Activity className="h-3.5 w-3.5 animate-spin" />
                    <span>Dispatching Fleet...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    <span>Dispatch Agents</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
