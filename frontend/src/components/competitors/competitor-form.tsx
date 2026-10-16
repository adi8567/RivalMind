'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Building, Globe, Link2, AlignLeft } from 'lucide-react';
import { Competitor } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CompetitorFormProps {
  initialData?: Partial<Competitor>;
  onSubmit: (data: Partial<Competitor>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CompetitorForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CompetitorFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [industry, setIndustry] = useState(initialData?.industry || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [urls, setUrls] = useState<string[]>(
    initialData?.monitoring_urls && initialData.monitoring_urls.length > 0
      ? initialData.monitoring_urls
      : ['']
  );

  const handleAddUrl = () => {
    setUrls([...urls, '']);
  };

  const handleRemoveUrl = (index: number) => {
    if (urls.length === 1) {
      setUrls(['']);
      return;
    }
    setUrls(urls.filter((_, i) => i !== index));
  };

  const handleUrlChange = (index: number, val: string) => {
    const updated = [...urls];
    updated[index] = val;
    setUrls(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrls = urls.map((u) => u.trim()).filter((u) => u.length > 0);
    await onSubmit({
      name,
      industry,
      website,
      description,
      monitoring_urls: cleanUrls,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
          <Building className="h-3.5 w-3.5 text-primary" />
          Competitor Organization Name *
        </label>
        <Input
          required
          placeholder="e.g. Datadog Systems, Splunk, Elastic"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-primary" />
            Website Domain *
          </label>
          <Input
            required
            type="url"
            placeholder="https://example.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-primary" />
            Industry / Category *
          </label>
          <Input
            required
            placeholder="e.g. Observability & APM, Cloud Security"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
          <AlignLeft className="h-3.5 w-3.5 text-primary" />
          Strategic Overview / Description
        </label>
        <Textarea
          placeholder="Summary of product line, target market, and primary competitive overlap..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 text-primary" />
            Monitored Target URLs (Pricing, Changelog, SEC Filings)
          </label>
          <button
            type="button"
            onClick={handleAddUrl}
            className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium"
          >
            <Plus className="h-3 w-3" />
            Add URL
          </button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {urls.map((url, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                type="url"
                placeholder="https://competitor.com/pricing"
                value={url}
                onChange={(e) => handleUrlChange(idx, e.target.value)}
                className="text-xs"
              />
              <button
                type="button"
                onClick={() => handleRemoveUrl(idx)}
                className="text-muted-foreground hover:text-rose-400 p-1.5 rounded transition-colors"
                title="Remove URL"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-input bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving Profile...' : initialData?.id ? 'Update Competitor' : 'Save & Monitor'}
        </button>
      </div>
    </form>
  );
}
