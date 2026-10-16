'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Server,
  Database,
  Cpu,
  Key,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Sliders,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { getSettings, getIsDemoFallbackActive } from '@/lib/api';
import { SettingsInfo } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Orchestrator Settings & System Health
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Environment parameters, vector database status, agent runtime configuration, and demo mode controls.
          </p>
        </div>

        <button
          onClick={loadSettings}
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground px-3 py-2 rounded-lg border border-border transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Status
        </button>
      </div>

      {loading || !settings ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Operating Mode Status Card */}
          <Card className="bg-card/70 border-border">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-primary" />
                  Runtime Operating Mode
                </CardTitle>
                <Badge
                  variant={settings.demo_mode ? 'warning' : 'success'}
                  className="text-xs uppercase"
                >
                  {settings.demo_mode ? 'Demo Mode Active' : 'Live Autonomous Mode'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {settings.demo_mode ? (
                  <span>
                    The orchestrator is presently running in <strong>Synthetic Demo Mode</strong>. In this mode, all agent pipelines execute realistic simulation graphs without incurring commercial LLM token costs or triggering live external scrapers.
                  </span>
                ) : (
                  <span>
                    The orchestrator is running in <strong>Live Autonomous Mode</strong>. Real API calls are executed against Playwright browser instances, vector stores, and configured LLM providers.
                  </span>
                )}
              </p>

              <div className="bg-secondary/40 p-3.5 rounded-lg border border-border flex items-start gap-3">
                <Terminal className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="font-semibold text-foreground">How to switch between Demo and Live Mode:</div>
                  <div>
                    Modify <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono">DEMO_MODE=false</code> in your <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono">.env</code> file and ensure <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono">LLM_API_KEY</code> is set. Restart the FastAPI backend server.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure & Database Health */}
          <Card className="bg-card/70 border-border">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Infrastructure & Integrations Health
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PostgreSQL */}
                <div className="bg-secondary/40 p-4 rounded-lg border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="h-6 w-6 text-primary" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">PostgreSQL 16</div>
                      <div className="text-xs text-muted-foreground">Relational Schema & Intelligence Store</div>
                    </div>
                  </div>
                  <Badge variant={settings.postgres_connected ? 'success' : 'destructive'}>
                    {settings.postgres_connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>

                {/* Pinecone */}
                <div className="bg-secondary/40 p-4 rounded-lg border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cpu className="h-6 w-6 text-indigo-400" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">Pinecone Vector Index</div>
                      <div className="text-xs text-muted-foreground">Financial RAG & Semantic Embeddings</div>
                    </div>
                  </div>
                  <Badge variant={settings.pinecone_connected ? 'success' : 'secondary'}>
                    {settings.pinecone_connected ? 'Index Active' : 'Demo Memory / Mock'}
                  </Badge>
                </div>

                {/* LLM Engine */}
                <div className="bg-secondary/40 p-4 rounded-lg border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cpu className="h-6 w-6 text-emerald-400" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">LLM Provider & Model</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {settings.llm_provider} / {settings.llm_model}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    Configured
                  </Badge>
                </div>

                {/* Playwright Scraper */}
                <div className="bg-secondary/40 p-4 rounded-lg border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Terminal className="h-6 w-6 text-blue-400" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">Playwright Headless Browser</div>
                      <div className="text-xs text-muted-foreground">Dynamic SPA & Price Scraper Engine</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
                    Ready
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables Audit */}
          <Card className="bg-card/70 border-border">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Environment Variable Status (No Secrets Exposed)
                </CardTitle>
                <span className="text-xs text-muted-foreground">Server Configuration Audit</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="divide-y divide-border/60">
                {Object.entries(settings.env_status).map(([envVar, isSet]) => (
                  <div key={envVar} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">{envVar}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSet ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Present & Loaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                          <XCircle className="h-3.5 w-3.5" /> Not Set (Default Used)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
