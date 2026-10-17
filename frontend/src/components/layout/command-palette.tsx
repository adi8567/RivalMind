'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Building2,
  FlaskConical,
  Package,
  DollarSign,
  TrendingUp,
  Newspaper,
  FileText,
  Link as LinkIcon,
  Settings,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Zap,
  X,
} from 'lucide-react';
import { fetchCompetitors } from '@/lib/api';
import { Competitor } from '@/types';
import { Badge } from '@/components/ui/badge';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenNewAnalysis: () => void;
}

export function CommandPalette({ open, onClose, onOpenNewAnalysis }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      fetchCompetitors().then(setCompetitors).catch(() => {});
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Handle escape and keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const navItems = [
    { title: 'Dashboard', href: '/', icon: LayoutDashboard, category: 'Navigation' },
    { title: 'Monitored Competitors', href: '/competitors', icon: Building2, category: 'Navigation' },
    { title: 'Research Pipeline Runs', href: '/research', icon: FlaskConical, category: 'Navigation' },
    { title: 'Product & Feature Delta', href: '/products', icon: Package, category: 'Navigation' },
    { title: 'Pricing & Monetization', href: '/pricing', icon: DollarSign, category: 'Navigation' },
    { title: 'Financial SEC RAG Intel', href: '/financial', icon: TrendingUp, category: 'Navigation' },
    { title: 'Market News Stream', href: '/news', icon: Newspaper, category: 'Navigation' },
    { title: 'Executive Intelligence Reports', href: '/reports', icon: FileText, category: 'Navigation' },
    { title: 'Evidence & Source Registry', href: '/sources', icon: LinkIcon, category: 'Navigation' },
    { title: 'Engine & Provider Settings', href: '/settings', icon: Settings, category: 'Navigation' },
  ];

  const filteredNav = navItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCompetitors = competitors.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.industry && c.industry.toLowerCase().includes(query.toLowerCase()))
  );

  const actions = [
    {
      title: 'Launch New Analysis',
      subtitle: 'Trigger multi-agent orchestration for a target competitor',
      icon: Sparkles,
      action: () => {
        onClose();
        onOpenNewAnalysis();
      },
    },
  ];

  const filteredActions = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-border/80 bg-[#0c111d] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5 bg-card/40">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search pages, targets, reports or execute actions..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <Badge variant="outline" className="text-[10px] font-mono border-border/80 text-muted-foreground py-0.5">
            ESC
          </Badge>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Quick Actions
              </p>
              <div className="space-y-1">
                {filteredActions.map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.title}
                      onClick={act.action}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-primary/15 hover:border-primary/30 border border-transparent text-left group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            {act.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {act.subtitle}
                          </p>
                        </div>
                      </div>
                      <Zap className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Competitors */}
          {filteredCompetitors.length > 0 && (
            <div>
              <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Monitored Competitors ({filteredCompetitors.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {filteredCompetitors.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => {
                      onClose();
                      router.push(`/competitors/${comp.id}`);
                    }}
                    className="flex items-center justify-between p-2 rounded-xl border border-border/40 bg-card/30 hover:bg-card hover:border-border text-left group transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 font-bold text-xs shrink-0">
                        {comp.name.substring(0, 1)}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-medium text-foreground group-hover:text-primary truncate">
                          {comp.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {comp.industry || 'Technology'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          {filteredNav.length > 0 && (
            <div>
              <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Navigation & Views
              </p>
              <div className="space-y-1">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        onClose();
                        router.push(item.href);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-card/70 border border-transparent hover:border-border/60 text-left group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {item.href}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredNav.length === 0 && filteredCompetitors.length === 0 && filteredActions.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching commands or targets found for &quot;{query}&quot;.
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 bg-card/60 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-[10px] font-mono">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-[10px] font-mono">↓</kbd>
            <span>to navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>CI Orchestrator Live Command Bus</span>
          </div>
        </div>
      </div>
    </div>
  );
}
