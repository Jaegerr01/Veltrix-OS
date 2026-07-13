'use client';

// Entity Phase 2 — Goal Cascade panel. Shows the ratified month target vs
// actuals and this week's department goals. "Draft cascade" files a
// goal_ratification card into Barry's Approval Queue — nothing activates
// until he approves it there.

import { useCallback, useEffect, useState } from 'react';
import { Target, RefreshCw, GitBranch } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { useToast } from '@/components/Toast';
import type { EntityGoal } from '@/lib/types';

const DEPT_LABEL: Record<string, string> = {
  growth: 'Growth', revenue: 'Revenue', delivery: 'Delivery', product: 'Product',
  finance: 'Finance', intelligence: 'Intelligence', governance: 'Governance', core: 'Core',
};

export default function GoalCascadePanel() {
  const [month, setMonth] = useState<EntityGoal | null>(null);
  const [weekly, setWeekly] = useState<EntityGoal[]>([]);
  const [closed, setClosed] = useState(0);
  const [periods, setPeriods] = useState({ month: '', week: '' });
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/entity/goals');
      const data = await res.json();
      if (data.success) {
        setMonth(data.month);
        setWeekly(data.weekly || []);
        setClosed(data.closedThisMonth || 0);
        setPeriods({ month: data.monthPeriod, week: data.weekPeriod });
      }
    } catch { /* empty state */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const draft = async () => {
    setDrafting(true);
    try {
      const res = await authFetch('/api/entity/goals', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Cascade drafted', `$${data.draft.revenueTarget.toLocaleString()} target for ${data.draft.monthPeriod} — ratify it in the Approval Queue.`);
      } else {
        toast.error('Draft failed', data.error);
      }
    } catch (e: any) {
      toast.error('Draft failed', e?.message);
    } finally {
      setDrafting(false);
    }
  };

  const target = Number((month?.target as any)?.revenue ?? 0);
  const pct = target > 0 ? Math.min(100, Math.round((closed / target) * 100)) : 0;

  return (
    <div className="rounded-2xl bg-[rgba(13,13,22,0.55)] backdrop-blur-xl border border-white/[0.07] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.18em]">Entity · Goal Cascade</p>
          <h3 className="text-[15px] font-bold text-white mt-1 flex items-center gap-2">
            <Target size={15} className="text-neon-purple" />
            {periods.month || 'This Month'} · {periods.week || ''}
          </h3>
        </div>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-neon-cyan transition-colors cursor-pointer">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {month ? (
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-[20px] font-bold text-white font-mono">${closed.toLocaleString()}</span>
            <span className="text-[11px] font-mono text-white/35">of ${target.toLocaleString()} · {pct}%</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-cyan transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] font-mono text-white/30 mt-1.5">{month.title}</p>
        </div>
      ) : (
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 text-[11px] font-sans text-white/40">
          No ratified cascade for this month yet. Draft one — it lands in your Approval Queue for one-click ratification.
        </div>
      )}

      {weekly.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[9px] font-mono text-white/25 uppercase tracking-wider">This week&apos;s department goals</p>
          {weekly.map(g => (
            <div key={g.id} className="flex items-center gap-2 text-[11px] font-sans">
              <span className="text-[9px] font-mono text-neon-cyan/70 bg-neon-cyan/5 border border-neon-cyan/15 px-1.5 py-0.5 rounded-full min-w-[76px] text-center">
                {DEPT_LABEL[g.department ?? ''] ?? g.department}
              </span>
              <span className="text-white/55 leading-snug">{g.title}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={draft}
        disabled={drafting}
        className="flex items-center justify-center gap-2 text-[11px] font-mono text-neon-purple bg-neon-purple/10 border border-neon-purple/25 px-3 py-2 rounded-lg hover:bg-neon-purple/20 transition-colors cursor-pointer disabled:opacity-40"
      >
        <GitBranch size={12} />
        {drafting ? 'Drafting…' : month ? 'Re-draft cascade → Approval Queue' : 'Draft this month’s cascade → Approval Queue'}
      </button>
    </div>
  );
}
