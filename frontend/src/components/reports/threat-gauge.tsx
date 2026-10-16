'use client';

import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { cn } from '@/lib/utils';

interface ThreatGaugeProps {
  score: number;
  size?: number;
  className?: string;
  showExplanation?: boolean;
}

export function ThreatGauge({ score, size = 180, className, showExplanation = true }: ThreatGaugeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  let color = '#10b981'; // 0-30 green
  let level = 'Low Threat';
  let levelColor = 'text-emerald-400';
  let badgeBg = 'bg-emerald-500/10 border-emerald-500/20';

  if (clampedScore > 60) {
    color = '#ef4444'; // 60-100 red
    level = 'Critical Threat';
    levelColor = 'text-rose-400';
    badgeBg = 'bg-rose-500/10 border-rose-500/20';
  } else if (clampedScore > 30) {
    color = '#f59e0b'; // 30-60 amber
    level = 'Moderate Threat';
    levelColor = 'text-amber-400';
    badgeBg = 'bg-amber-500/10 border-amber-500/20';
  }

  const data = [
    {
      name: 'Threat Score',
      value: clampedScore,
      fill: color,
    },
  ];

  if (!mounted) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-4', className)}>
        <div className="h-36 w-36 rounded-full border-4 border-slate-700/40 flex items-center justify-center">
          <span className="text-2xl font-bold">{clampedScore}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="75%"
            outerRadius="100%"
            barSize={12}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: '#1e293b' }}
              dataKey="value"
              cornerRadius={8}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">
            {clampedScore}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground uppercase">
            / 100 Index
          </span>
        </div>
      </div>

      {showExplanation && (
        <div className="mt-2 text-center">
          <div className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border', badgeBg, levelColor)}>
            {level}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-[180px]">
            Aggregated threat score computed from market, pricing & financial indicators.
          </p>
        </div>
      )}
    </div>
  );
}
