'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
  Radar,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Competitors', href: '/competitors', icon: Building2 },
  { name: 'Research Runs', href: '/research', icon: FlaskConical },
  { name: 'Product Intel', href: '/products', icon: Package },
  { name: 'Pricing', href: '/pricing', icon: DollarSign },
  { name: 'Financial Intel', href: '/financial', icon: TrendingUp },
  { name: 'News', href: '/news', icon: Newspaper },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Sources', href: '/sources', icon: LinkIcon },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger trigger */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border text-foreground shadow-md"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-[#0b0f19] text-foreground transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center gap-3 border-b border-border/80 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/30 shadow-inner">
            <Radar className="h-5 w-5 animate-spin-slow" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-foreground text-base">
              CI Orchestrator
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
              Competitive Intelligence
            </span>
          </div>
        </div>

        {/* Demo banner indicator */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs text-primary-foreground">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-emerald-400">Autonomous Fleet</span>
            </div>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-emerald-500/30 text-emerald-400">
              Demo Active
            </Badge>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/25 font-semibold shadow-sm'
                    : 'text-muted-foreground hover:bg-card/70 hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {isActive && (
                  <ChevronRight className="h-3.5 w-3.5 text-primary/70" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer status box */}
        <div className="border-t border-border/80 p-4">
          <div className="rounded-lg bg-card/60 border border-border/60 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-foreground">Multi-Agent RAG</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              7 specialized agents verifying claims against live filings & telemetry.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
