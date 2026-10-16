'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConfidenceLevel, EvidenceType } from '@/types';
import { cn } from '@/lib/utils';

interface ReportSectionProps {
  title: string;
  icon?: LucideIcon;
  confidence?: ConfidenceLevel;
  evidenceType?: EvidenceType;
  defaultExpanded?: boolean;
  className?: string;
  badgeText?: string;
  children: React.ReactNode;
}

export function ReportSection({
  title,
  icon: Icon,
  confidence,
  evidenceType,
  defaultExpanded = true,
  className,
  badgeText,
  children,
}: ReportSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getConfidenceBadge = (level: ConfidenceLevel) => {
    switch (level) {
      case 'high':
        return <Badge variant="success">High Confidence (90%+)</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium Confidence (70-89%)</Badge>;
      case 'low':
        return <Badge variant="destructive">Low Confidence (&lt;70%)</Badge>;
    }
  };

  const getEvidenceBadge = (type: EvidenceType) => {
    switch (type) {
      case 'verified_fact':
        return (
          <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Verified Fact
          </span>
        );
      case 'retrieved_info':
        return (
          <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Retrieved Info
          </span>
        );
      case 'ai_interpretation':
        return (
          <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            AI Interpretation
          </span>
        );
    }
  };

  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all overflow-hidden',
        className
      )}
    >
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex cursor-pointer items-center justify-between border-b border-border/70 bg-card/60 px-5 py-4 transition-colors hover:bg-card/90"
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {badgeText && (
            <Badge variant="outline" className="text-xs">
              {badgeText}
            </Badge>
          )}
          {confidence && getConfidenceBadge(confidence)}
          {evidenceType && getEvidenceBadge(evidenceType)}
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-5 md:p-6 text-sm text-foreground/90 animate-in fade-in-0 duration-200">
          {children}
        </div>
      )}
    </section>
  );
}
