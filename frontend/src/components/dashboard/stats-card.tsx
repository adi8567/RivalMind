import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  description,
  className,
}: StatsCardProps) {
  const getChangeBadge = () => {
    if (!change) return null;

    let textClass = 'text-slate-400';
    let IconComponent = Minus;

    if (changeType === 'positive') {
      textClass = 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
      IconComponent = ArrowUpRight;
    } else if (changeType === 'negative') {
      textClass = 'text-rose-400 bg-rose-500/10 border border-rose-500/20';
      IconComponent = ArrowDownRight;
    } else {
      textClass = 'text-slate-400 bg-slate-800 border border-slate-700';
    }

    return (
      <span className={cn('inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-semibold', textClass)}>
        <IconComponent className="h-3 w-3" />
        {change}
      </span>
    );
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card/95 to-secondary/30 p-5 shadow-sm transition-all hover:border-primary/40',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {value}
        </div>
        {getChangeBadge()}
      </div>

      {description && (
        <p className="mt-1.5 text-[11px] text-muted-foreground truncate">
          {description}
        </p>
      )}
    </div>
  );
}
