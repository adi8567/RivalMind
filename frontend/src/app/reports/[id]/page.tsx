'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Building2,
  Calendar,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Package,
  DollarSign,
  Newspaper,
  Compass,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
  Clock,
  Printer,
  Share2,
  Layers,
} from 'lucide-react';
import { getReport, getIsDemoFallbackActive } from '@/lib/api';
import { Report } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { ThreatGauge } from '@/components/reports/threat-gauge';
import { ReportSection } from '@/components/reports/report-section';

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      if (!reportId) return;
      try {
        const data = await getReport(reportId);
        setReport(data);
      } catch (err) {
        console.error('Failed to load report', err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-12 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-foreground">Report Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Unable to locate the specified intelligence dossier.
        </p>
        <Link
          href="/reports"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Reports
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link
            href="/reports"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dossiers
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Link
              href={`/competitors/${report.competitor_id}`}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Building2 className="h-3.5 w-3.5" />
              {report.competitor_name}
            </Link>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Generated {formatDate(report.created_at)}
            </span>
            <span className="text-muted-foreground text-xs">•</span>
            <Badge variant="outline" className="text-[11px] border-emerald-500/30 text-emerald-400">
              Verified by Synthesis Agent
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {report.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {getIsDemoFallbackActive() && (
            <Badge variant="outline" className="border-amber-500/30 text-amber-400">
              Synthetic Demo Dossier
            </Badge>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80 px-3 py-2 rounded-lg border border-border transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Threat Assessment & Executive Summary Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Executive Summary Card (2 Cols) */}
        <Card className="lg:col-span-2 bg-card/80 border-border">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Executive Summary
              </CardTitle>
              <Badge variant="success" className="text-[11px]">
                High Confidence
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <p className="text-sm leading-relaxed text-foreground/90 font-medium">
              {report.executive_summary}
            </p>

            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Major Developments & Inflection Points
              </h4>
              <ul className="space-y-2">
                {report.major_developments.map((dev, idx) => (
                  <li key={idx} className="text-xs text-foreground/80 flex items-start gap-2 bg-secondary/40 p-2.5 rounded-md border border-border/50">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{dev}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Explainable Threat Assessment Card (1 Col) */}
        <Card className="bg-card/80 border-border flex flex-col justify-between">
          <CardHeader className="pb-2 border-b border-border/60">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
              Threat Index
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-4 space-y-4">
            <div className="flex justify-center">
              <ThreatGauge score={report.threat_score} size={150} showExplanation={false} />
            </div>

            <div className="bg-secondary/60 p-3 rounded-lg border border-border space-y-2">
              <div className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Threat Rationale & Scoring Drivers:
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {report.threat_assessment}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Pillar Sections */}
      <div className="space-y-4">
        {/* Product Intelligence Section */}
        <ReportSection
          title="Product Intelligence"
          icon={Package}
          confidence="high"
          evidenceType="verified_fact"
        >
          <div className="space-y-2">
            {report.product_intel.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90 bg-secondary/30 p-2.5 rounded border border-border/40">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </ReportSection>

        {/* Pricing Intelligence Section */}
        <ReportSection
          title="Pricing & Packaging Intelligence"
          icon={DollarSign}
          confidence="high"
          evidenceType="verified_fact"
        >
          <div className="space-y-2">
            {report.pricing_intel.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90 bg-secondary/30 p-2.5 rounded border border-border/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </ReportSection>

        {/* Financial Intelligence Section */}
        <ReportSection
          title="Financial RAG & SEC Disclosures"
          icon={TrendingUp}
          confidence="high"
          evidenceType="retrieved_info"
        >
          <div className="space-y-2">
            {report.financial_intel.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90 bg-secondary/30 p-2.5 rounded border border-border/40">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </ReportSection>

        {/* News Intelligence Section */}
        <ReportSection
          title="News, Leadership & Market Sentiment"
          icon={Newspaper}
          confidence="medium"
          evidenceType="retrieved_info"
        >
          <div className="space-y-2">
            {report.news_intel.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90 bg-secondary/30 p-2.5 rounded border border-border/40">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </ReportSection>

        {/* Strategic Moves Section */}
        <ReportSection
          title="Autonomous Strategic Moves Analysis"
          icon={Compass}
          confidence="medium"
          evidenceType="ai_interpretation"
        >
          <div className="space-y-2">
            {report.strategic_moves.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90 bg-secondary/30 p-2.5 rounded border border-border/40">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </ReportSection>
      </div>

      {/* Risks and Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risks */}
        <Card className="bg-rose-950/10 border-rose-500/30">
          <CardHeader className="pb-3 border-b border-rose-500/20">
            <CardTitle className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Competitive Risks to Our Position
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {report.risks.map((risk, idx) => (
              <div key={idx} className="bg-card/80 p-3 rounded-lg border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">{risk.title}</span>
                  <Badge variant="destructive" className="uppercase text-[9px] px-1.5">
                    {risk.severity} Severity
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{risk.description}</p>
                {risk.mitigation && (
                  <div className="text-[11px] text-primary pt-1 border-t border-border/40 mt-1">
                    <strong>Recommended Defense:</strong> {risk.mitigation}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card className="bg-emerald-950/10 border-emerald-500/30">
          <CardHeader className="pb-3 border-b border-emerald-500/20">
            <CardTitle className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Strategic Exploitation Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {report.opportunities.map((opp, idx) => (
              <div key={idx} className="bg-card/80 p-3 rounded-lg border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">{opp.title}</span>
                  <Badge variant="success" className="uppercase text-[9px] px-1.5">
                    {opp.impact} Impact
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{opp.description}</p>
                {opp.timeframe && (
                  <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/40 mt-1">
                    <strong>Window:</strong> {opp.timeframe}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Strategic Implications & Recommendations */}
      <Card className="bg-card/80 border-border">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Compass className="h-5 w-5 text-primary" />
            Strategic Implications & Recommended Counter-Tactics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-foreground/90 leading-relaxed font-medium bg-secondary/30 p-4 rounded-lg border border-border">
            {report.strategic_implications}
          </p>
        </CardContent>
      </Card>

      {/* Evidence-Backed Source Directory */}
      <Card className="bg-card/80 border-border">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Cited Evidence & Source Verification Registry
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {report.sources.length} Audited Sources
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/20">
                <tr>
                  <th className="py-2.5 px-3">Source Title & Snippet</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Credibility</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Verification Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {report.sources.map((src) => (
                  <tr key={src.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 px-3 max-w-[280px]">
                      <div className="font-semibold text-foreground truncate">{src.title}</div>
                      {src.snippet && (
                        <div className="text-[11px] text-muted-foreground truncate">{src.snippet}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {src.source_type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-emerald-400">
                        {src.credibility_score}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(src.retrieved_at)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        Source <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
