'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Building2,
  Calendar,
  ShieldAlert,
  ArrowRight,
  Search,
  Sparkles,
  Download,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { getReports, fetchCompetitors, getIsDemoFallbackActive } from '@/lib/api';
import { Report, Competitor } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { ThreatGauge } from '@/components/reports/threat-gauge';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [repData, compData] = await Promise.all([
          getReports(),
          fetchCompetitors(),
        ]);
        setReports(repData);
        setCompetitors(compData);
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchComp =
        selectedCompetitor === 'all' || r.competitor_id === selectedCompetitor;
      const matchSearch =
        searchTerm === '' ||
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.competitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.executive_summary.toLowerCase().includes(searchTerm.toLowerCase());
      return matchComp && matchSearch;
    });
  }, [reports, selectedCompetitor, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Executive Intelligence Reports
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Multi-agent synthesized dossiers with explainable threat scoring, strategic implications, and cited evidence.
          </p>
        </div>

        {getIsDemoFallbackActive() && (
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 self-start sm:self-auto">
            Synthetic / Demo Intelligence Active
          </Badge>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card border border-border p-3 rounded-lg">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search executive reports, summaries..."
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
            <option value="all">All Competitors</option>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-medium text-foreground">No reports found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Initiate a research run to generate a synthesized executive intelligence report.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Card
              key={report.id}
              className="bg-card/70 border-border hover:border-primary/40 transition-all"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
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
                        {formatDate(report.created_at)}
                      </span>
                      <span className="text-muted-foreground text-xs">•</span>
                      <Badge variant="outline" className="text-[10px]">
                        {report.sources.length} Verified Sources
                      </Badge>
                    </div>

                    <Link href={`/reports/${report.id}`}>
                      <h2 className="text-lg font-bold text-foreground hover:text-primary transition-colors">
                        {report.title}
                      </h2>
                    </Link>

                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {report.executive_summary}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {report.major_developments.slice(0, 2).map((dev, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-secondary/80 text-foreground/80 px-2.5 py-1 rounded-md border border-border flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span className="truncate max-w-[320px]">{dev}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex sm:flex-row lg:flex-col items-center justify-between lg:justify-center border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6 gap-4 shrink-0">
                    <div className="flex flex-col items-center">
                      <ThreatGauge score={report.threat_score} size={110} />
                    </div>

                    <Link
                      href={`/reports/${report.id}`}
                      className="inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs px-4 py-2 rounded-lg transition-colors shadow-xs"
                    >
                      Read Full Report <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
