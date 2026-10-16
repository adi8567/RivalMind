'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  Clock,
  ExternalLink,
  Search,
  Filter,
  Sparkles,
  Globe,
} from 'lucide-react';
import { getNews, fetchCompetitors, getIsDemoFallbackActive } from '@/lib/api';
import { NewsItem, Competitor } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [newsData, compData] = await Promise.all([
          getNews(),
          fetchCompetitors(),
        ]);
        setNews(newsData);
        setCompetitors(compData);
      } catch (err) {
        console.error('Failed to load news intelligence', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchComp =
        selectedCompetitor === 'all' || item.competitor_id === selectedCompetitor;
      const matchSentiment =
        selectedSentiment === 'all' || item.sentiment === selectedSentiment;
      const matchSearch =
        searchTerm === '' ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.competitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.source_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchComp && matchSentiment && matchSearch;
    });
  }, [news, selectedCompetitor, selectedSentiment, searchTerm]);

  const stats = useMemo(() => {
    const positive = news.filter((n) => n.sentiment === 'positive').length;
    const neutral = news.filter((n) => n.sentiment === 'neutral').length;
    const negative = news.filter((n) => n.sentiment === 'negative').length;
    return { positive, neutral, negative, total: news.length };
  }, [news]);

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return (
          <Badge variant="success" className="flex items-center gap-1 text-[11px]">
            <TrendingUp className="h-3 w-3" /> Positive
          </Badge>
        );
      case 'negative':
        return (
          <Badge variant="destructive" className="flex items-center gap-1 text-[11px]">
            <TrendingDown className="h-3 w-3" /> Negative
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1 text-[11px]">
            <Minus className="h-3 w-3" /> Neutral
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Newspaper className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              News & Market Developments
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Continuous ingestion of press releases, regulatory announcements, media mentions, and market sentiment.
          </p>
        </div>

        {getIsDemoFallbackActive() && (
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 self-start sm:self-auto">
            Synthetic / Demo Intelligence Active
          </Badge>
        )}
      </div>

      {/* Sentiment Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium">Total Tracked Stories</div>
            <div className="text-2xl font-bold mt-1 text-foreground">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-emerald-400 font-medium">Positive Signals</div>
            <div className="text-2xl font-bold mt-1 text-emerald-400">{stats.positive}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-slate-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-slate-400 font-medium">Neutral / Informational</div>
            <div className="text-2xl font-bold mt-1 text-slate-300">{stats.neutral}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-rose-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-rose-400 font-medium">Negative / Risks</div>
            <div className="text-2xl font-bold mt-1 text-rose-400">{stats.negative}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card border border-border p-3 rounded-lg">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search news, headlines, M&A..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary text-foreground text-sm pl-9 pr-3 py-1.5 rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Competitor filter */}
          <select
            value={selectedCompetitor}
            onChange={(e) => setSelectedCompetitor(e.target.value)}
            className="bg-secondary text-foreground text-xs py-1.5 px-3 rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Competitors</option>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sentiment filter */}
          <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-md border border-border">
            {['all', 'positive', 'neutral', 'negative'].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSentiment(s)}
                className={`text-xs px-2.5 py-1 rounded transition-colors capitalize ${
                  selectedSentiment === s
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* News Feed Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border">
          <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-medium text-foreground">No news articles match criteria</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search terms or sentiment filter.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNews.map((item) => (
            <Card
              key={item.id}
              className="bg-card/70 border-border hover:border-primary/40 transition-all"
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/competitors/${item.competitor_id}`}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <Building2 className="h-3 w-3" />
                        {item.competitor_name}
                      </Link>
                      <span className="text-muted-foreground text-xs">•</span>
                      <Badge variant="outline" className="text-[10px] px-2 py-0 border-border">
                        {item.category}
                      </Badge>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.published_at)}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-foreground hover:text-primary transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="pt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80 flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.source_name}
                      </span>
                      {item.source_url && (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          Read Original <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 sm:self-start">
                    {getSentimentBadge(item.sentiment)}
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
