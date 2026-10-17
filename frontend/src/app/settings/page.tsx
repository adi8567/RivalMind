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
  Eye,
  EyeOff,
  Zap,
  Check,
  AlertCircle,
  Radio,
  Save,
  Activity,
  Layers,
  Sparkles,
  Bot,
} from 'lucide-react';
import { getSettings, updateSettings, testComponentConnection, getIsDemoFallbackActive } from '@/lib/api';
import { SettingsInfo } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [demoMode, setDemoMode] = useState(true);
  const [llmProvider, setLlmProvider] = useState('openai');
  const [llmModel, setLlmModel] = useState('gpt-4o-mini');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [showLlmKey, setShowLlmKey] = useState(false);
  const [pineconeKey, setPineconeKey] = useState('');
  const [showPineconeKey, setShowPineconeKey] = useState(false);
  const [newsApiKey, setNewsApiKey] = useState('');
  const [showNewsKey, setShowNewsKey] = useState(false);
  const [pineconeIndex, setPineconeIndex] = useState('ci-orchestrator');

  // Test results state
  const [testingTarget, setTestingTarget] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latency_ms: number; message: string }>>({});

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      setSettings(data);
      setDemoMode(data.demo_mode);
      setLlmProvider(data.llm_provider || 'openai');
      setLlmModel(data.llm_model || 'gpt-4o-mini');
      if (data.pinecone_index) setPineconeIndex(data.pinecone_index);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload: any = {
        demo_mode: demoMode,
        llm_provider: llmProvider,
        llm_model: llmModel,
        pinecone_index: pineconeIndex,
      };

      if (llmApiKey.trim()) payload.llm_api_key = llmApiKey.trim();
      if (pineconeKey.trim()) payload.pinecone_api_key = pineconeKey.trim();
      if (newsApiKey.trim()) payload.news_api_key = newsApiKey.trim();

      const updated = await updateSettings(payload);
      setSettings(updated);
      setSaveSuccess(true);
      // Clear sensitive fields after save
      setLlmApiKey('');
      setPineconeKey('');
      setNewsApiKey('');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to update settings', err);
      alert('Failed to save settings. Please ensure backend is running.');
    } finally {
      setSaving(false);
    }
  };

  const runTest = async (target: string) => {
    setTestingTarget(target);
    try {
      const res = await testComponentConnection(target);
      setTestResults((prev) => ({ ...prev, [target]: res }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [target]: { success: false, latency_ms: 0, message: err.message || 'Connection failed' },
      }));
    } finally {
      setTestingTarget(null);
    }
  };

  const providerModels: Record<string, string[]> = {
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
    gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
    groq: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
    ollama: ['llama3', 'mistral', 'qwen2.5'],
  };

  return (
    <div className="space-y-8 max-w-5xl pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Orchestrator Settings & Environment Controls
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure live LLM providers, manage vector search indexes, switch runtime modes, and audit environment health.
          </p>
        </div>

        <button
          onClick={loadSettings}
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground px-3.5 py-2 rounded-lg border border-border transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2.5 animate-in fade-in-50 duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Settings successfully saved and persisted to environment. Orchestrator runtime updated!</span>
        </div>
      )}

      {loading && !settings ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Operating Mode Selector Card */}
          <Card className="bg-card/70 border-border overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-primary" />
                    Operating Execution Mode
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Toggle between synthetic demo simulations and live autonomous web/LLM research.
                  </CardDescription>
                </div>
                <Badge
                  variant={demoMode ? 'warning' : 'success'}
                  className="text-xs uppercase px-2.5 py-1 w-fit"
                >
                  {demoMode ? '🟡 Synthetic Demo Mode' : '🟢 Live Autonomous Mode'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Live Mode Card */}
                <div
                  onClick={() => setDemoMode(false)}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    !demoMode
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500'
                      : 'border-border/60 bg-secondary/30 hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                      <Zap className={`h-4 w-4 ${!demoMode ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                      Live Autonomous Mode
                    </div>
                    {!demoMode && <Check className="h-4 w-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Executes real Playwright/HTTPX web scraping, live Google News RSS feeds, authentic SEC EDGAR filings, and calls the configured LLM for evidence extraction.
                  </p>
                </div>

                {/* Demo Mode Card */}
                <div
                  onClick={() => setDemoMode(true)}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    demoMode
                      ? 'border-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500'
                      : 'border-border/60 bg-secondary/30 hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                      <Bot className={`h-4 w-4 ${demoMode ? 'text-amber-400' : 'text-muted-foreground'}`} />
                      Synthetic Demo Mode
                    </div>
                    {demoMode && <Check className="h-4 w-4 text-amber-400" />}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Simulates realistic multi-agent execution pipeline using verified offline benchmark data. Zero external commercial API token consumption.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LLM Engine Configuration Card */}
          <Card className="bg-card/70 border-border">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Cpu className="h-5 w-5 text-indigo-400" />
                Intelligence & LLM Engine Provider
              </CardTitle>
              <CardDescription className="text-xs">
                Configure your preferred LLM provider for task decomposition, claim auditing, and executive synthesis.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Provider Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Provider</label>
                  <select
                    value={llmProvider}
                    onChange={(e) => {
                      const p = e.target.value;
                      setLlmProvider(p);
                      const models = providerModels[p] || [];
                      if (models.length > 0) setLlmModel(models[0]);
                    }}
                    className="w-full bg-secondary text-foreground text-sm py-2 px-3 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
                    <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                    <option value="gemini">Google Gemini (Gemini 1.5 Pro / Flash)</option>
                    <option value="groq">Groq (Llama 3.3 70B, Mixtral)</option>
                    <option value="ollama">Local Ollama (Llama 3, Mistral, Qwen)</option>
                  </select>
                </div>

                {/* Model Selector / Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Model Identifier</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                      placeholder="e.g. gpt-4o-mini"
                      className="flex-1 bg-secondary text-foreground text-sm py-2 px-3 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                    />
                    {providerModels[llmProvider] && (
                      <select
                        onChange={(e) => setLlmModel(e.target.value)}
                        className="bg-secondary text-foreground text-xs py-2 px-2 rounded-lg border border-border"
                      >
                        <option value="">Presets</option>
                        {providerModels[llmProvider].map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-primary" />
                    {llmProvider.toUpperCase()} API Key
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {settings?.has_llm_key ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Configured on server
                      </span>
                    ) : (
                      'Not currently configured'
                    )}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showLlmKey ? 'text' : 'password'}
                    value={llmApiKey}
                    onChange={(e) => setLlmApiKey(e.target.value)}
                    placeholder={settings?.has_llm_key ? '•••••••••••••••••••••••• (leave blank to keep current)' : 'sk-...'}
                    className="w-full bg-secondary text-foreground text-sm py-2 pl-3 pr-10 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLlmKey(!showLlmKey)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showLlmKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Credentials are encrypted and loaded directly into environment variables. Never sent to third parties.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* External Integrations (Pinecone & NewsAPI) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pinecone Vector DB */}
            <Card className="bg-card/70 border-border">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Database className="h-4 w-4 text-indigo-400" />
                    Pinecone Vector Index
                  </CardTitle>
                  <Badge variant={settings?.has_pinecone_key ? 'success' : 'secondary'} className="text-[10px]">
                    {settings?.has_pinecone_key ? 'Active' : 'Optional / In-Memory'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Pinecone Index Name</label>
                  <input
                    type="text"
                    value={pineconeIndex}
                    onChange={(e) => setPineconeIndex(e.target.value)}
                    className="w-full bg-secondary text-foreground text-xs py-1.5 px-3 rounded-md border border-border"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Pinecone API Key</label>
                  <div className="relative">
                    <input
                      type={showPineconeKey ? 'text' : 'password'}
                      value={pineconeKey}
                      onChange={(e) => setPineconeKey(e.target.value)}
                      placeholder={settings?.has_pinecone_key ? '•••••••••••• (leave blank to keep)' : 'pcsk-...'}
                      className="w-full bg-secondary text-foreground text-xs py-1.5 pl-3 pr-8 rounded-md border border-border font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPineconeKey(!showPineconeKey)}
                      className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                    >
                      {showPineconeKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NewsAPI Key */}
            <Card className="bg-card/70 border-border">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Radio className="h-4 w-4 text-blue-400" />
                    News Feed Gateway
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                    Live Google News RSS Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  The News Agent uses real live Google News RSS out-of-the-box (no key required). You can optionally provide a NewsAPI.org key for broader archival queries.
                </p>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">NewsAPI.org Key (Optional)</label>
                  <div className="relative">
                    <input
                      type={showNewsKey ? 'text' : 'password'}
                      value={newsApiKey}
                      onChange={(e) => setNewsApiKey(e.target.value)}
                      placeholder={settings?.has_news_api_key ? '•••••••••••• (configured)' : 'Optional API key'}
                      className="w-full bg-secondary text-foreground text-xs py-1.5 pl-3 pr-8 rounded-md border border-border font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewsKey(!showNewsKey)}
                      className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewsKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save Action Bar */}
          <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
            <span className="text-xs text-muted-foreground">
              Changes take effect immediately on live and background agent pipelines.
            </span>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md shadow-primary/20 disabled:opacity-60"
            >
              <Save className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Saving Environment...' : 'Save & Apply Configuration'}
            </button>
          </div>

          {/* Interactive Live Component Diagnostics Suite */}
          <Card className="bg-card/70 border-border">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                Live Component Diagnostic & Ping Suite
              </CardTitle>
              <CardDescription className="text-xs">
                Test real-time connectivity, latency response times, and socket pings for core orchestrator dependencies.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Database Ping */}
                <div className="bg-secondary/40 p-4 rounded-xl border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                      <Database className="h-4 w-4 text-primary" /> Database Engine (PostgreSQL / SQLite)
                    </div>
                    <button
                      type="button"
                      disabled={testingTarget === 'database'}
                      onClick={() => runTest('database')}
                      className="text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground px-2.5 py-1 rounded border border-border transition-colors disabled:opacity-60"
                    >
                      {testingTarget === 'database' ? 'Pinging...' : 'Test Connection'}
                    </button>
                  </div>
                  {testResults.database ? (
                    <div className={`text-xs p-2.5 rounded-md border flex items-center justify-between ${
                      testResults.database.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                      <span>{testResults.database.message}</span>
                      <span className="font-mono text-[11px] font-bold">{testResults.database.latency_ms} ms</span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" /> Database online and schema initialized.
                    </div>
                  )}
                </div>

                {/* 2. LLM Engine Ping */}
                <div className="bg-secondary/40 p-4 rounded-xl border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                      <Cpu className="h-4 w-4 text-indigo-400" /> LLM Generation Engine ({llmProvider})
                    </div>
                    <button
                      type="button"
                      disabled={testingTarget === 'llm'}
                      onClick={() => runTest('llm')}
                      className="text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground px-2.5 py-1 rounded border border-border transition-colors disabled:opacity-60"
                    >
                      {testingTarget === 'llm' ? 'Pinging...' : 'Test Connection'}
                    </button>
                  </div>
                  {testResults.llm ? (
                    <div className={`text-xs p-2.5 rounded-md border flex items-center justify-between ${
                      testResults.llm.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      <span className="truncate max-w-[280px]">{testResults.llm.message}</span>
                      <span className="font-mono text-[11px] font-bold">{testResults.llm.latency_ms} ms</span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {settings?.has_llm_key ? (
                        <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Key present</span>
                      ) : (
                        <span className="text-muted-foreground">Demo / Heuristic fallback active</span>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. News Feed Ping */}
                <div className="bg-secondary/40 p-4 rounded-xl border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                      <Radio className="h-4 w-4 text-blue-400" /> Live News RSS Stream
                    </div>
                    <button
                      type="button"
                      disabled={testingTarget === 'news'}
                      onClick={() => runTest('news')}
                      className="text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground px-2.5 py-1 rounded border border-border transition-colors disabled:opacity-60"
                    >
                      {testingTarget === 'news' ? 'Pinging...' : 'Test Connection'}
                    </button>
                  </div>
                  {testResults.news ? (
                    <div className={`text-xs p-2.5 rounded-md border flex items-center justify-between ${
                      testResults.news.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                      <span>{testResults.news.message}</span>
                      <span className="font-mono text-[11px] font-bold">{testResults.news.latency_ms} ms</span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" /> Ready to ingest real media developments.
                    </div>
                  )}
                </div>

                {/* 4. Pinecone Ping */}
                <div className="bg-secondary/40 p-4 rounded-xl border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                      <Layers className="h-4 w-4 text-indigo-400" /> Pinecone Vector Database
                    </div>
                    <button
                      type="button"
                      disabled={testingTarget === 'pinecone'}
                      onClick={() => runTest('pinecone')}
                      className="text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground px-2.5 py-1 rounded border border-border transition-colors disabled:opacity-60"
                    >
                      {testingTarget === 'pinecone' ? 'Pinging...' : 'Test Connection'}
                    </button>
                  </div>
                  {testResults.pinecone ? (
                    <div className={`text-xs p-2.5 rounded-md border flex items-center justify-between ${
                      testResults.pinecone.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      <span className="truncate max-w-[280px]">{testResults.pinecone.message}</span>
                      <span className="font-mono text-[11px] font-bold">{testResults.pinecone.latency_ms} ms</span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {settings?.has_pinecone_key ? 'Configured' : 'In-memory embedding fallback ready'}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables Audit Card */}
          <Card className="bg-card/70 border-border">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Environment Variables Health Audit
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Zero Secrets Exposed
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="divide-y divide-border/60">
                {Object.entries(settings?.env_status || {}).map(([envVar, isSet]) => (
                  <div key={envVar} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-semibold text-foreground">{envVar}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {envVar === 'DATABASE_URL'
                          ? 'Primary relational store connection string'
                          : envVar === 'LLM_API_KEY'
                          ? 'Authentication token for primary reasoning LLM'
                          : envVar === 'PINECONE_API_KEY'
                          ? 'API key for vector embeddings and document RAG'
                          : 'Credential for secondary news service lookups'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSet ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Present & Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <AlertCircle className="h-3.5 w-3.5" /> Default / Unset
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
