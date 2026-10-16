'use client';

import React from 'react';
import {
  Brain,
  Globe,
  Tag,
  TrendingUp,
  Newspaper,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { AgentProgress, AgentStatus } from '@/types';
import { cn } from '@/lib/utils';

interface AgentPipelineProps {
  agentProgress?: Record<string, AgentProgress>;
  currentAgent?: string;
  className?: string;
}

interface PipelineStepDef {
  id: string;
  shortName: string;
  fullName: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PIPELINE_STEPS: PipelineStepDef[] = [
  { id: 'planner', shortName: 'Planner', fullName: 'Planner Agent', icon: Brain },
  { id: 'web_research', shortName: 'Web Research', fullName: 'Web Research Agent', icon: Globe },
  { id: 'product_pricing', shortName: 'Product/Pricing', fullName: 'Product & Pricing Agent', icon: Tag },
  { id: 'financial', shortName: 'Financial RAG', fullName: 'Financial SEC RAG Agent', icon: TrendingUp },
  { id: 'news', shortName: 'News Intel', fullName: 'News Intelligence Agent', icon: Newspaper },
  { id: 'verification', shortName: 'Verification', fullName: 'Claim Verification Agent', icon: ShieldCheck },
  { id: 'synthesis', shortName: 'Synthesis', fullName: 'Executive Synthesis Agent', icon: FileCheck },
];

export function AgentPipeline({ agentProgress = {}, currentAgent, className }: AgentPipelineProps) {
  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-rose-400" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusStyle = (status: AgentStatus) => {
    switch (status) {
      case 'completed':
        return 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]';
      case 'running':
        return 'border-blue-500/60 bg-blue-950/40 text-blue-300 shadow-[0_0_16px_rgba(59,130,246,0.3)] animate-pulse';
      case 'failed':
        return 'border-rose-500/50 bg-rose-950/30 text-rose-300';
      case 'pending':
      default:
        return 'border-border/60 bg-card/40 text-muted-foreground opacity-60';
    }
  };

  return (
    <div className={cn('w-full rounded-xl border border-border bg-card/70 p-4 sm:p-6 backdrop-blur-sm', className)}>
      <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Autonomous Multi-Agent Pipeline Execution
          </h3>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          7-Stage Verified Topology
        </span>
      </div>

      {/* Stepper container with horizontal scrolling on smaller viewports */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center justify-between min-w-[760px] gap-2">
          {PIPELINE_STEPS.map((step, idx) => {
            const progress = agentProgress[step.id];
            const status: AgentStatus = progress?.status || 'pending';
            const StepIcon = step.icon;
            const isLast = idx === PIPELINE_STEPS.length - 1;

            return (
              <React.Fragment key={step.id}>
                {/* Agent Node */}
                <div className="flex flex-col items-center flex-1 min-w-[95px] text-center">
                  <div
                    className={cn(
                      'relative flex h-14 w-14 items-center justify-center rounded-xl border-2 transition-all duration-300',
                      getStatusStyle(status)
                    )}
                  >
                    <StepIcon className="h-6 w-6" />
                    <span className="absolute -bottom-2 -right-1.5 rounded-full bg-[#0b0f19] p-0.5 border border-border">
                      {getStatusIcon(status)}
                    </span>
                  </div>

                  <span className="mt-2.5 text-xs font-semibold text-foreground truncate w-full px-1">
                    {step.shortName}
                  </span>

                  <div className="flex items-center gap-1 mt-0.5">
                    <span
                      className={cn(
                        'text-[10px] font-mono capitalize',
                        status === 'completed' && 'text-emerald-400',
                        status === 'running' && 'text-blue-400 font-semibold',
                        status === 'failed' && 'text-rose-400',
                        status === 'pending' && 'text-slate-500'
                      )}
                    >
                      {status === 'running' ? 'Active' : status}
                    </span>
                    {progress?.elapsed_seconds !== undefined && progress.elapsed_seconds > 0 && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({progress.elapsed_seconds}s)
                      </span>
                    )}
                  </div>
                </div>

                {/* Connecting arrow / line */}
                {!isLast && (
                  <div className="flex items-center justify-center px-1 text-slate-700 flex-shrink-0">
                    <ArrowRight
                      className={cn(
                        'h-4 w-4 transition-colors',
                        status === 'completed' ? 'text-emerald-500/70' : 'text-slate-700'
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Live status ticker */}
      {currentAgent && (
        <div className="mt-4 rounded-lg bg-secondary/40 border border-border/50 px-3 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Current Operator:</span>
            <span className="font-semibold text-foreground">{currentAgent}</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            Event-Driven Agent Communication Bus
          </span>
        </div>
      )}
    </div>
  );
}
