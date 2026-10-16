'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  Clock,
  Building2,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { getProducts, fetchCompetitors, getIsDemoFallbackActive } from '@/lib/api';
import { ProductIntel, Competitor } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductIntel[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [prodData, compData] = await Promise.all([
          getProducts(),
          fetchCompetitors(),
        ]);
        setProducts(prodData);
        setCompetitors(compData);
      } catch (err) {
        console.error('Failed to load product intelligence', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchComp =
        selectedCompetitor === 'all' || item.competitor_id === selectedCompetitor;
      const matchType =
        selectedType === 'all' || item.change_type === selectedType;
      const matchSearch =
        searchTerm === '' ||
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.competitor_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchComp && matchType && matchSearch;
    });
  }, [products, selectedCompetitor, selectedType, searchTerm]);

  const stats = useMemo(() => {
    const launches = products.filter((p) => p.change_type === 'launch').length;
    const features = products.filter((p) => p.change_type === 'feature').length;
    const updates = products.filter((p) => p.change_type === 'update').length;
    const deprecations = products.filter((p) => p.change_type === 'deprecation').length;
    return { launches, features, updates, deprecations, total: products.length };
  }, [products]);

  const getChangeBadgeVariant = (type: string) => {
    switch (type) {
      case 'launch':
        return 'success';
      case 'feature':
        return 'purple';
      case 'update':
        return 'info';
      case 'deprecation':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Package className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Product Intelligence
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Autonomously tracked releases, feature modifications, documentation shifts, and deprecations.
          </p>
        </div>

        {getIsDemoFallbackActive() && (
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 self-start sm:self-auto">
            Synthetic / Demo Intelligence Active
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium">Total Signals</div>
            <div className="text-2xl font-bold mt-1 text-foreground">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-emerald-400 font-medium">New Launches</div>
            <div className="text-2xl font-bold mt-1 text-emerald-400">{stats.launches}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-purple-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-purple-400 font-medium">Major Features</div>
            <div className="text-2xl font-bold mt-1 text-purple-400">{stats.features}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-blue-400 font-medium">Core Updates</div>
            <div className="text-2xl font-bold mt-1 text-blue-400">{stats.updates}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-rose-500/20 col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="text-xs text-rose-400 font-medium">Deprecations</div>
            <div className="text-2xl font-bold mt-1 text-rose-400">{stats.deprecations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card border border-border p-3 rounded-lg">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search features, products, keywords..."
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

          {/* Change type filter */}
          <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-md border border-border">
            {['all', 'launch', 'feature', 'update', 'deprecation'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`text-xs px-2.5 py-1 rounded transition-colors capitalize ${
                  selectedType === t
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Product Intel Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-medium text-foreground">No product intelligence matches</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try resetting your filters or run a new competitive research cycle.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((item) => (
            <Card
              key={item.id}
              className="bg-card/70 border-border hover:border-primary/40 transition-all flex flex-col justify-between"
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
                    <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                      {item.product_name}
                    </CardTitle>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={getChangeBadgeVariant(item.change_type)} className="capitalize">
                      {item.change_type}
                    </Badge>
                    {item.impact && (
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          item.impact === 'high'
                            ? 'text-rose-400 bg-rose-500/10'
                            : item.impact === 'medium'
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-slate-400 bg-slate-500/10'
                        }`}
                      >
                        {item.impact} Impact
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>

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
                      Inspect Source <ExternalLink className="h-3 w-3" />
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
