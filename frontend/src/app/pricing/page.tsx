'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Clock,
  ExternalLink,
  Search,
  ArrowRight,
  ShieldAlert,
  Percent,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { getPricing, fetchCompetitors, getIsDemoFallbackActive } from '@/lib/api';
import { PricingIntel, Competitor } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function PricingPage() {
  const [pricingItems, setPricingItems] = useState<PricingIntel[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [pricingData, compData] = await Promise.all([
          getPricing(),
          fetchCompetitors(),
        ]);
        setPricingItems(pricingData);
        setCompetitors(compData);
      } catch (err) {
        console.error('Failed to load pricing intelligence', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredPricing = useMemo(() => {
    return pricingItems.filter((item) => {
      const matchComp =
        selectedCompetitor === 'all' || item.competitor_id === selectedCompetitor;
      const matchSearch =
        searchTerm === '' ||
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pricing_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tier_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.change_description || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchComp && matchSearch;
    });
  }, [pricingItems, selectedCompetitor, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Pricing Intelligence
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Strict evidence-based pricing tracking. Compares current versus recorded baselines without hallucinating historical prices.
          </p>
        </div>

        {getIsDemoFallbackActive() && (
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 self-start sm:self-auto">
            Synthetic / Demo Intelligence Active
          </Badge>
        )}
      </div>

      {/* Rules Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Pricing Verification Policy:</strong> All pricing metrics are extracted strictly from published price lists, rate cards, SEC disclosures, or press announcements. Where historical rates were not previously observed in the database, the agent marks baseline comparison as &quot;No prior baseline&quot; to prevent synthetic rate inflation.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card border border-border p-3 rounded-lg">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tiers, models, products..."
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

      {/* Pricing Cards List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredPricing.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-medium text-foreground">No pricing intelligence recorded</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No price shifts matched your search filters.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPricing.map((item) => (
            <Card
              key={item.id}
              className="bg-card/70 border-border hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/competitors/${item.competitor_id}`}
                        className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <Building2 className="h-3 w-3" />
                        {item.competitor_name}
                      </Link>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.detected_at)}
                      </span>
                    </div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {item.product_name}
                    </CardTitle>
                  </div>

                  <Badge variant="secondary" className="font-mono text-xs capitalize">
                    {item.pricing_model}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0 pb-4 space-y-4">
                {/* Price Shift Comparison Box */}
                {(item.previous_price || item.current_price) && (
                  <div className="bg-secondary/60 rounded-lg p-3 border border-border flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase font-semibold">Prior Baseline</div>
                      <div className="text-sm font-semibold text-foreground/70 mt-0.5">
                        {item.previous_price || 'Unrecorded / New Model'}
                      </div>
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-2 shrink-0" />

                    <div className="text-right">
                      <div className="text-[11px] text-emerald-400 uppercase font-semibold">Current Price</div>
                      <div className="text-sm font-bold text-emerald-400 mt-0.5">
                        {item.current_price || 'Variable / Quote-based'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tier and Structure Details */}
                <div className="text-xs text-muted-foreground leading-relaxed bg-card/40 p-3 rounded-md border border-border/40">
                  <div className="text-[10px] uppercase font-bold text-foreground/80 mb-1">Tier & Packaging Structure</div>
                  {item.tier_details}
                </div>

                {item.change_description && (
                  <p className="text-xs text-foreground/90 font-medium">
                    <span className="text-primary font-bold">Shift Analysis: </span>
                    {item.change_description}
                  </p>
                )}

                {item.source_url && (
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono truncate max-w-[280px]">
                      {item.source_url}
                    </span>
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 inline-flex items-center gap-1 font-medium ml-2"
                    >
                      Rate Card Source <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
