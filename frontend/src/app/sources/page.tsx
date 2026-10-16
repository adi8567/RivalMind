'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Link2,
  ExternalLink,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  Clock,
  Globe,
  FileText,
  DollarSign,
  TrendingUp,
  Newspaper,
  Layers,
} from 'lucide-react';
import { getRunSources, fetchCompetitors, getIsDemoFallbackActive } from '@/lib/api';
import { Source, Competitor } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [srcData, compData] = await Promise.all([
          getRunSources('all'),
          fetchCompetitors(),
        ]);
        setSources(srcData);
        setCompetitors(compData);
      } catch (err) {
        console.error('Failed to load sources', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      const matchType = selectedType === 'all' || s.source_type === selectedType;
      const matchSearch =
        searchTerm === '' ||
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.snippet || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.competitor_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchType && matchSearch;
    });
  }, [sources, selectedType, searchTerm]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sec_filing':
      case 'financial':
        return <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />;
      case 'pricing':
        return <DollarSign className="h-3.5 w-3.5 text-emerald-400" />;
      case 'news':
        return <Newspaper className="h-3.5 w-3.5 text-blue-400" />;
      default:
        return <Globe className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Link2 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Audited Evidence Sources
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Complete provenance registry of all raw URLs, SEC filings, press releases, and pricing tables discovered by agents.
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
            placeholder="Search URLs, domains, snippets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary text-foreground text-sm pl-9 pr-3 py-1.5 rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-md border border-border overflow-x-auto w-full md:w-auto">
          {['all', 'website', 'pricing', 'sec_filing', 'financial', 'news'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`text-xs px-2.5 py-1 rounded transition-colors whitespace-nowrap capitalize ${
                selectedType === t
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Sources Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredSources.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border">
          <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-medium text-foreground">No sources match filters</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try resetting your search query or source type selector.
          </p>
        </Card>
      ) : (
        <Card className="bg-card/70 border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/30">
                <tr>
                  <th className="py-3 px-4">Title & Context</th>
                  <th className="py-3 px-4">Target Competitor</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Credibility Index</th>
                  <th className="py-3 px-4">Discovery Time</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSources.map((src) => (
                  <tr key={src.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 max-w-[340px]">
                      <div className="font-semibold text-foreground text-sm truncate">{src.title}</div>
                      {src.snippet && (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {src.snippet}
                        </div>
                      )}
                      <div className="text-[11px] font-mono text-primary/80 truncate mt-1">
                        {src.url}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {src.competitor_name ? (
                        <span className="font-medium text-foreground flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                          {src.competitor_name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">General</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant="outline" className="text-[10px] capitalize flex items-center gap-1 w-fit">
                        {getTypeIcon(src.source_type)}
                        {src.source_type.replace('_', ' ')}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold text-xs ${
                            src.credibility_score >= 90
                              ? 'text-emerald-400'
                              : src.credibility_score >= 70
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {src.credibility_score}%
                        </span>
                        <ShieldCheck
                          className={`h-3.5 w-3.5 ${
                            src.credibility_score >= 90
                              ? 'text-emerald-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                      {formatDate(src.retrieved_at)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-md transition-colors"
                      >
                        Inspect <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
