'use client';

import React, { useState } from 'react';
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
  Info,
  Terminal,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AgentProgress, AgentStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface AgentPipelineProps {
  agentProgress?: Record<string, AgentProgress>;
  currentAgent?: string;
  className?: string;
}

interface PipelineStepDef {
  id: string;
  shortName: string;
  fullName: string;
  roleDescription: string;
  tools: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const PIPELINE_STEPS: PipelineStepDef[] = [
  {
    id: 'planner',
    shortName: 'Planner',
    fullName: 'Planner Orchestration Agent',
    roleDescription: 'Decomposes strategic queries into parallel research tasks and assigns agent roles.',
    tools: ['LangGraph DAG', 'Query Decomposition', 'Task Dispatcher'],
    icon: Brain,
  },
  {
    id: 'web_research',
    shortName: 'Web Research',
    fullName: 'Web Research & Crawling Agent',
    roleDescription: 'Explores competitor landing pages, changelogs, and documentation for new announcements.',
    tools: ['Playwright', 'HTTPX', 'BeautifulSoup4', 'DuckDuckGo API'],
    icon: Globe,
  },
  {
    id: 'product_pricing',
    shortName: 'Product/Pricing',
    fullName: 'Product & Pricing Agent',
    roleDescription: 'Structures product releases, tier reorganizations, and price elasticity changes.',
    tools: ['Regex Price Parser', 'Tier Comparator', 'LLM Categorizer'],
    icon: Tag,
  },
  {
    id: 'financial',
    shortName: 'Financial RAG',
    fullName: 'Financial & Regulatory RAG Agent',
    roleDescription: 'Performs semantic vector search over SEC 10-K, 10-Q, investor decks, and Wikipedia infoboxes.',
    tools: ['Pinecone Vector DB', 'SEC EDGAR API', 'Chunk Embedder', 'Wikipedia API'],
    icon: TrendingUp,
  },
  {
    id: 'news',
    shortName: 'News Intel',
    fullName: 'News Stream & Sentiment Agent',
    roleDescription: 'Aggregates real-time news articles and classifies sentiment and strategic risk categories.',
    tools: ['Live Google News RSS', 'NewsAPI Engine', 'Sentiment Classifier'],
    icon: Newspaper,
  },
  {
    id: 'verification',
    shortName: 'Verification',
    fullName: 'Cross-Claim Verification Agent',
    roleDescription: 'Calculates cross-agent claim credibility, detects discrepancies, and flags conflicting evidence.',
    tools: ['Cross-Claim Matrix', 'Credibility Scorer', 'Conflict Resolver'],
    icon: ShieldCheck,
  },
  {
    id: 'synthesis',
    shortName: 'Synthesis',
    fullName: 'Executive Synthesis Agent',
    roleDescription: 'Generates evidence-backed strategic briefings, calculates explainable threat scores, and lists mitigations.',
    tools: ['Executive LLM Synthesizer', 'Threat Score Calculator', 'Markdown Dossier Formatter'],
    icon: FileCheck,
  },
];

export function AgentPipeline({ agentProgress = {}, currentAgent, className }: AgentPipelineProps) {
  const [selectedStep, setSelectedStep] = useState<PipelineStepDef | null>(null);

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
        return 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.2)] hover:border-emerald-400';
      case 'running':
        return 'border-blue-500/70 bg-blue-950/50 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.35)] ring-2 ring-blue-500/30 animate-pulse hover:border-blue-400';
      case 'failed':
        return 'border-rose-500/60 bg-rose-950/40 text-rose-300 hover:border-rose-400';
      case 'pending':
      default:
        return 'border-border/60 bg-card/40 text-muted-foreground opacity-60 hover:opacity-90 hover:border-border';
    }
  };

  return (
    <>
      <div className={cn('w-full rounded-2xl border border-border/70 bg-[#0c111d]/90 p-5 sm:p-6 backdrop-blur-md shadow-lg', className)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 mb-5 gap-2">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Autonomous Multi-Agent Pipeline Execution
            </h3>
            <Badge variant="outline" className="text-[10px] font-mono border-blue-500/30 text-blue-400 bg-blue-500/10">
              Interactive Topology
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            Click any agent to inspect live state & tools
          </span>
        </div>

        {/* Stepper container with horizontal scrolling */}
        <div className="overflow-x-auto pb-3 pt-1">
          <div className="flex items-center justify-between min-w-[760px] gap-2">
            {PIPELINE_STEPS.map((step, idx) => {
              const progress = agentProgress[step.id];
              const status: AgentStatus = progress?.status || 'pending';
              const StepIcon = step.icon;
              const isLast = idx === PIPELINE_STEPS.length - 1;

              return (
                <React.Fragment key={step.id}>
                  {/* Interactive Agent Node */}
                  <button
                    onClick={() => setSelectedStep(step)}
                    type="button"
                    className="flex flex-col items-center flex-1 min-w-[95px] text-center group cursor-pointer focus:outline-none"
                  >
                    <div
                      className={cn(
                        'relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all duration-300 group-hover:scale-105 active:scale-95',
                        getStatusStyle(status)
                      )}
                    >
                      <StepIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
                      <span className="absolute -bottom-2 -right-1.5 rounded-full bg-[#0b0f19] p-0.5 border border-border shadow-md">
                        {getStatusIcon(status)}
                      </span>
                    </div>

                    <span className="mt-2.5 text-xs font-semibold text-foreground truncate w-full px-1 group-hover:text-primary transition-colors">
                      {step.shortName}
                    </span>

                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className={cn(
                          'text-[10px] font-mono capitalize',
                          status === 'completed' && 'text-emerald-400 font-medium',
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
                  </button>

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
      </div>

      {/* Agent Inspector Modal Dialog */}
      <Dialog open={!!selectedStep} onOpenChange={(open) => !open && setSelectedStep(null)}>
        {selectedStep && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2 text-base">
                  <selectedStep.icon className="h-5 w-5 text-primary" />
                  {selectedStep.fullName}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[11px] uppercase font-mono',
                    agentProgress[selectedStep.id]?.status === 'completed' && 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
                    agentProgress[selectedStep.id]?.status === 'running' && 'border-blue-500/40 text-blue-400 bg-blue-500/10 animate-pulse',
                    agentProgress[selectedStep.id]?.status === 'failed' && 'border-rose-500/40 text-rose-400 bg-rose-500/10',
                    (!agentProgress[selectedStep.id] || agentProgress[selectedStep.id]?.status === 'pending') && 'border-slate-700 text-slate-400'
                  )}
                >
                  {agentProgress[selectedStep.id]?.status || 'pending'}
                </Badge>
              </div>
              <DialogDescription className="text-xs pt-1">
                {selectedStep.roleDescription}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Telemetry / Live Status Box */}
              <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-blue-400" />
                    Latest Execution Telemetry
                  </span>
                  {agentProgress[selectedStep.id]?.elapsed_seconds !== undefined && (
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Runtime: {agentProgress[selectedStep.id]?.elapsed_seconds}s
                    </span>
                  )}
                </div>
                <div className="p-2.5 rounded-lg bg-[#070b14] border border-border/60 text-xs font-mono text-slate-300 whitespace-pre-wrap">
                  {agentProgress[selectedStep.id]?.message ||
                    (agentProgress[selectedStep.id]?.status === 'completed'
                      ? 'Execution completed successfully with verified outputs stored in graph state.'
                      : 'Agent queued in orchestrator execution graph.')}
                </div>
              </div>

              {/* Tools & Engine Integration */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-purple-400" />
                  Equipped Toolchains & Gateways
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStep.tools.map((tool) => (
                    <Badge
                      key={tool}
                      variant="outline"
                      className="text-[11px] font-mono border-border/80 bg-card/80 text-muted-foreground"
                    >
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Agent Mission Specs */}
              <div className="rounded-xl border border-border/60 bg-card/40 p-3 text-xs text-muted-foreground space-y-1">
                <span className="font-semibold text-foreground">Verification Policy:</span>
                <p className="text-[11px] leading-relaxed">
                  Every factual claim generated by this agent is linked with supporting URLs or filing citations. Unsubstantiated claims are submitted to the Verification Agent for cross-referencing.
                </p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
