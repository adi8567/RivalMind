'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2,
  Globe,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  Calendar,
  Layers,
  FlaskConical,
  Package,
  DollarSign,
  Newspaper,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Shield,
} from 'lucide-react';
import {
  getCompetitor,
  getResearchRuns,
  getProducts,
  getPricing,
  getNews,
  startResearchRun,
  getRunFindings,
  getReports,
  getIsDemoFallbackActive,
} from '@/lib/api';
import {
  Competitor,
  ResearchRun,
  ProductIntel,
  PricingIntel,
  NewsItem,
  Finding,
  Report,
} from '@/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ThreatGauge } from '@/components/reports/threat-gauge';
import { formatDate, formatRelativeTime } from '@/lib/utils';

export default function CompetitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const compId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [products, setProducts] = useState<ProductIntel[]>([]);
  const [pricing, setPricing] = useState<PricingIntel[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStartingRun, setIsStartingRun] = useState(false);

  useEffect(() => {
    async function loadAll() {
      if (!compId) return;
      try {
        const [compData, allRuns, allProducts, allPricing, allNews, allReports] = await Promise.all([
          getCompetitor(compId),
          getResearchRuns(),
          getProducts(compId),
          getPricing(compId),
          getNews(compId),
          getReports(),
        ]);

        setCompetitor(compData);
        setRuns(allRuns.filter((r) => r.competitor_id === compId || r.competitor_id === compData.id));
        setProducts(allProducts);
        setPricing(allPricing);
        setNews(allNews);

        const targetReport = allReports.find(
          (r) => r.competitor_id === compId || r.competitor_id === compData.id
        );
        if (targetReport) {
          setReport(targetReport);
          const fList = await getRunFindings(targetReport.run_id);
          setFindings(fList);
        } else {
          const fList = await getRunFindings('run-101');
          setFindings(fList);
        }
      } catch (err) {
        console.error('Failed to load competitor details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [compId]);

  const handleStartAnalysis = async () => {
    if (!competitor) return;
    setIsStartingRun(true);
    try {
      const newRun = await startResearchRun(
        competitor.id,
        `Comprehensive audit for ${competitor.name}: Q3 product releases, pricing changes, and 10-Q filing risks.`
      );
      router.push(`/research/${newRun.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsStartingRun(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!competitor) {
    return (
      <div className="p-12 text-center rounded-xl border border-dashed border-border bg-card">
        <h3 className="text-base font-semibold text-foreground">Competitor Target Not Found</h3>
        <Link href="/competitors" className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Competitors List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/competitors"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Competitors
        </Link>

        <button
          onClick={handleStartAnalysis}
          disabled={isStartingRun}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          <span>{isStartingRun ? 'Dispatching Agents...' : 'Start New Analysis'}</span>
        </button>
      </div>

      {/* Target Header Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="lg:col-span-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {competitor.name}
            </h1>
            <Badge variant="outline" className="text-xs">
              {competitor.industry}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {competitor.description || 'Target organization under continuous automated intelligence monitoring.'}
          </p>

          <div className="flex flex-wrap items-center gap-5 pt-2 text-xs text-muted-foreground">
            <a
              href={competitor.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline font-medium"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{competitor.website}</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>Last Analyzed: {formatDate(competitor.last_analysis_at)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span>{competitor.monitoring_urls?.length ?? competitor.url_count ?? 1} Monitored URLs</span>
            </div>
          </div>
        </div>

        {/* Threat Gauge */}
        <div className="flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-border/70 pt-4 lg:pt-0 lg:pl-6">
          <ThreatGauge score={competitor.threat_score} size={130} />
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">
            Research History ({runs.length})
          </TabsTrigger>
          <TabsTrigger value="products">
            Products ({products.length})
          </TabsTrigger>
          <TabsTrigger value="pricing">
            Pricing ({pricing.length})
          </TabsTrigger>
          <TabsTrigger value="news">
            News Feed ({news.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Executive Summary Alert */}
          {report && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Latest Executive Synthesis
                </span>
                <Link
                  href={`/reports/${report.id}`}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  View Full Dossier <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {report.executive_summary}
              </p>
            </div>
          )}

          {/* Key Findings Grid */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Extracted & Cross-Verified Intelligence Findings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {findings.map((finding) => (
                <div
                  key={finding.id}
                  className="rounded-xl border border-border bg-card p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize text-[11px]">
                      {finding.category}
                    </Badge>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {finding.confidence.toUpperCase()} CONFIDENCE
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {finding.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {finding.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 2. Research History Tab */}
        <TabsContent value="history">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border/80 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Historical Orchestration Runs
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                {runs.length} Runs Recorded
              </span>
            </div>

            {runs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No past research executions for this target yet. Click Start New Analysis above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground">
                    <tr>
                      <th className="p-3.5 font-semibold">Scope / Query</th>
                      <th className="p-3.5 font-semibold">Status</th>
                      <th className="p-3.5 font-semibold">Execution Duration</th>
                      <th className="p-3.5 font-semibold">Triggered</th>
                      <th className="p-3.5 text-right font-semibold">Inspection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {runs.map((r) => (
                      <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-3.5 font-medium text-foreground max-w-sm truncate">
                          {r.query}
                        </td>
                        <td className="p-3.5">
                          {r.status === 'completed' ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Completed
                            </Badge>
                          ) : r.status === 'running' ? (
                            <Badge variant="info" className="gap-1 animate-pulse">
                              <Loader2 className="h-3 w-3 animate-spin" /> Running
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{r.status}</Badge>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground">
                          {r.duration_seconds ? `${r.duration_seconds}s` : 'In progress'}
                        </td>
                        <td className="p-3.5 text-muted-foreground font-mono">
                          {formatRelativeTime(r.started_at)}
                        </td>
                        <td className="p-3.5 text-right">
                          <Link
                            href={`/research/${r.id}`}
                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                          >
                            Pipeline View <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 3. Products Tab */}
        <TabsContent value="products">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="rounded-xl border border-border bg-card p-5 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      prod.change_type === 'launch'
                        ? 'success'
                        : prod.change_type === 'update'
                        ? 'info'
                        : prod.change_type === 'deprecation'
                        ? 'destructive'
                        : 'purple'
                    }
                    className="uppercase text-[10px] tracking-wider"
                  >
                    {prod.change_type}
                  </Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {formatDate(prod.detected_at)}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-foreground">
                  {prod.product_name}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {prod.description}
                </p>
                {prod.source_url && (
                  <a
                    href={prod.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline pt-2"
                  >
                    <span>Source Evidence</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 4. Pricing Tab */}
        <TabsContent value="pricing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pricing.map((prc) => (
              <div
                key={prc.id}
                className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary uppercase">
                    {prc.pricing_model}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {formatDate(prc.detected_at)}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-foreground">
                  {prc.product_name}
                </h4>
                <div className="rounded-lg bg-secondary/50 p-3 border border-border/60 text-xs space-y-1">
                  <div className="text-foreground font-medium">Tiers: {prc.tier_details}</div>
                  {prc.change_description && (
                    <div className="text-amber-400">Delta: {prc.change_description}</div>
                  )}
                  {prc.previous_price && prc.current_price && (
                    <div className="text-muted-foreground font-mono text-[11px] pt-1">
                      {prc.previous_price} &rarr;{' '}
                      <span className="text-foreground font-bold">{prc.current_price}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 5. News Tab */}
        <TabsContent value="news">
          <div className="space-y-4">
            {news.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{item.source_name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {item.category}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground font-mono">
                    {formatDate(item.published_at)}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  {item.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.summary}
                </p>
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  Read Source Article <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
