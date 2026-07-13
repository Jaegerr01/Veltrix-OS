'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * PageHeader — the one consistent anchor at the top of every page.
 *
 * Enterprise software earns trust through predictability: same place, same
 * hierarchy, every screen. Icon + title tell you where you are, subtitle
 * tells you what this screen is for, actions live on the right, and an
 * optional stats strip gives the page's vital numbers without scrolling.
 */

interface Stat {
  label: string;
  value: string | number;
  accent?: 'purple' | 'cyan' | 'green' | 'orange' | 'default';
}

const ACCENT: Record<NonNullable<Stat['accent']>, string> = {
  purple: 'text-neon-purple',
  cyan: 'text-neon-cyan',
  green: 'text-neon-green',
  orange: 'text-neon-orange',
  default: 'text-foreground',
};

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  stats?: Stat[];
}

export default function PageHeader({ icon: Icon, title, subtitle, actions, stats }: Props) {
  return (
    <header className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-neon-purple/10 border border-neon-purple/25 flex items-center justify-center flex-shrink-0">
            <Icon size={17} className="text-neon-purple" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold text-foreground leading-tight tracking-tight">{title}</h1>
            {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div className="flex flex-wrap gap-x-8 gap-y-2 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          {stats.map((s, i) => (
            <div key={i} className="flex items-baseline gap-2">
              <span className={`text-[15px] font-bold tabular-nums ${ACCENT[s.accent || 'default']}`}>{s.value}</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
