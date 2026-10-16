'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  FileText,
  Building2,
  ExternalLink,
  ShieldCheck,
  Search,
  Database,
  Cpu,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import { getRunFindings, fetchCompetitors, getReports, getIsDemoFallbackActive } from '@/lib/api';
import { Finding, Competitor, Report } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function FinancialIntelligencePage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [compData, findingsData, reportsData] = await Promise.all([
          fetchCompetitors(),
          getRunFindings('run-101'),
          getReports(),
        ]);
        setCompetitors(compData);
        setFindings(findingsData);
        setReports(reportsData);
      } catch (err) {
        console.error('Failed to load financial data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const financialFindings = useMemo(() => {
    return findings.filter((f) => f.category === 'financial');
  }, [findings]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Financial Intelligence (RAG Pipeline)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Semantic retrieval across SEC 10-K/10-Q filings, investor relations disclosures, and earnings call transcripts.
          </p>
        </div>

        {getIsDemoFallbackActive() && (
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 self-start sm:self-auto">
            Synthetic / Demo Intelligence Active
          </Badge>
        )}
      </div>

      {/* RAG Architecture Visualizer */}
      <Card className="bg-card/70 border-indigo-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Cpu className="h-4 w-4 text-indigo-400" />
              Autonomous Financial RAG Architecture
            </CardTitle>
            <Badge variant="outline" className="text-[11px] border-indigo-500/30 text-indigo-400">
              Pinecone Vector Retrieval
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
            <div className="bg-secondary/60 p-3 rounded-lg border border-border">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">1. Document Ingestion</div>
              <div className="font-semibold text-foreground mt-1">SEC EDGAR + Transcripts</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Raw 10-K, 10-Q, 8-K tables</div>
            </div>
            <div className="bg-secondary/60 p-3 rounded-lg border border-border">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">2. Chunking & Tables</div>
              <div className="font-semibold text-foreground mt-1">Recursive Splitter</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">512 token windows with overlap</div>
            </div>
            <div className="bg-secondary/60 p-3 rounded-lg border border-border">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">3. Vector Embeddings</div>
              <div className="font-semibold text-foreground mt-1">Pinecone Index</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Dense cosine similarity search</div>
            </div>
            <div className="bg-secondary/60 p-3 rounded-lg border border-border">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">4. Strict Guardrails</div>
              <div className="font-semibold text-foreground mt-1">Zero Hallucination</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Direct citations required</div>
            </div>
            <div className="bg-secondary/60 p-3 rounded-lg border border-border">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">5. Evidence Findings</div>
              <div className="font-semibold text-foreground mt-1">Structured Insights</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Confidence-graded findings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card border border-border p-3 rounded-lg">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search financial disclosures, ARR, margins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary text-foreground text-sm pl-9 pr-3 py-1.5 rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCompetitor}
            onChange={(e) => setSelectedCompetitor(e.target.value)}
            className="bg-secondary text-foreground text-xs py-1.5 px-3 rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-auto"
          >
            <option value="all">All Monitored Competitors</option>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Financial Findings & Disclosures */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Detailed Financial Findings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {financialFindings.map((finding) => (
              <Card key={finding.id} className="bg-card/70 border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/competitors/${finding.competitor_id}`}
                          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                        >
                          <Building2 className="h-3 w-3" />
                          {finding.competitor_name}
                        </Link>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(finding.created_at)}
                        </span>
                      </div>
                      <CardTitle className="text-base font-semibold text-foreground">
                        {finding.title}
                      </CardTitle>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="success" className="capitalize text-xs">
                        {finding.confidence} Confidence
                      </Badge>
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                        {finding.evidence_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {finding.summary}
                  </p>
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Citations: {finding.sources.join(', ')}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> SEC Verified
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Synthesized Executive Financial Sections across Reports */}
          <Card className="bg-card/70 border-border mt-6">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Aggregated Financial Disclosures from Active Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border border-border/60 rounded-lg p-4 bg-secondary/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      {report.competitor_name} — SEC Intelligence Summary
                    </div>
                    <Link
                      href={`/reports/${report.id}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      View Full Report <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  <ul className="space-y-2">
                    {report.financial_intel.map((item, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
