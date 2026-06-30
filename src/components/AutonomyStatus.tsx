'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Zap, RefreshCw, CheckCircle2, AlertCircle,
  Users, Mail, FileText, Calendar, Brain, TrendingUp,
  Play, Clock, ChevronRight
} from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

interface PipelineData {
  pipeline: {
    new: number;
    researched: number;
    qualified: number;
    contacted: number;
    replied: number;
    proposalSent: number;
    callBooked: number;
    won: number;
    total: number;
  };
  recentActivity: Array<{
    id: string;
    actor: string;
    action: string;
    status: string;
    createdAt: string;
  }>;
  lastPipelineRun: string | null;
  activeAgents: string[];
  pendingTasks: number;
  completedTasks: number;
  totalProposals: number;
}

interface RunResult {
  leadsProcessed: number;
  actionsExecuted: string[];
  errors: string[];
  durationMs: number;
}

const AGENT_ICONS: Record<string, string> = {
  'Lead Research Agent': '🔬',
  'Outreach Agent': '📧',
  'Follow-up Agent': '🔁',
  'Proposal Agent': '📝',
  'CEO Agent': '🧠',
  'Sales Agent': '💼',
  'Revenue Agent': '📊',
  'Content Agent': '✍️',
  'Delivery Manager Agent': '🚀',
  'Memory Manager Agent': '🗂️',
  'Pipeline': '⚙️',
};

const STAGE_CONFIG = [
  { key: 'new', label: 'New', color: '#6b7280', icon: Users },
  { key: 'qualified', label: 'Qualified', color: '#8b5cf6', icon: Zap },
  { key: 'contacted', label: 'Contacted', color: '#3b82f6', icon: Mail },
  { key: 'replied', label: 'Replied', color: '#06b6d4', icon: CheckCircle2 },
  { key: 'proposalSent', label: 'Proposal', color: '#f59e0b', icon: FileText },
  { key: 'callBooked', label: 'Call Booked', color: '#10b981', icon: Calendar },
  { key: 'won', label: 'Won', color: '#22c55e', icon: TrendingUp },
];

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AutonomyStatus() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefResult, setBriefResult] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await authFetch('/api/autopilot/status');
      const json = await res.json();
      if (json.success) {
        setData(json);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const triggerPipeline = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await authFetch('/api/autopilot/run', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setRunResult({
          leadsProcessed: json.leadsProcessed,
          actionsExecuted: json.actionsExecuted || [],
          errors: json.errors || [],
          durationMs: json.durationMs
        });
      }
      await fetchStatus();
    } catch (err: any) {
      setRunResult({ leadsProcessed: 0, actionsExecuted: [], errors: [err.message], durationMs: 0 });
    }
    setRunning(false);
  };

  const triggerDailyBrief = async () => {
    setBriefLoading(true);
    setBriefResult(null);
    try {
      const res = await authFetch('/api/autopilot/daily-brief', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setBriefResult(json.brief?.slice(0, 400) + '...');
      }
    } catch {}
    setBriefLoading(false);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 animate-pulse">
        <div className="h-5 w-40 bg-white/10 rounded mb-4" />
        <div className="h-24 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-purple-500/20 bg-black/50 overflow-hidden"
      style={{ backdropFilter: 'blur(20px)' }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={pulse ? { scale: [1, 1.2, 1] } : {}}
            className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center"
          >
            <Bot size={17} className="text-purple-400" />
          </motion.div>
          <div>
            <h3 className="font-bold text-white text-sm">Autonomous Agency</h3>
            <p className="text-white/40 text-xs">
              Last run: {timeAgo(data?.lastPipelineRun || null)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

      {/* Pipeline Funnel */}
      <div className="px-6 py-4 border-b border-white/8">
        <p className="text-[10px] font-mono text-white/35 uppercase tracking-widest mb-3">Pipeline Funnel</p>
        <div className="flex items-end gap-1.5">
          {STAGE_CONFIG.map(stage => {
            const count = data?.pipeline[stage.key as keyof typeof data.pipeline] as number || 0;
            const max = Math.max(...STAGE_CONFIG.map(s => data?.pipeline[s.key as keyof typeof data.pipeline] as number || 0), 1);
            const height = Math.max(8, (count / max) * 48);
            return (
              <div key={stage.key} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[10px] font-mono text-white/60">{count}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="w-full rounded-sm"
                  style={{ background: stage.color + '66', border: `1px solid ${stage.color}44` }}
                />
                <span className="text-[8px] text-white/30 text-center leading-tight">{stage.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-white/30">{data?.pipeline.total || 0} total leads</span>
          <span className="text-[10px] text-green-400 font-mono">{data?.pipeline.won || 0} won</span>
        </div>
      </div>

      {/* Active Agents */}
      {(data?.activeAgents?.length ?? 0) > 0 && (
        <div className="px-6 py-3 border-b border-white/8">
          <p className="text-[10px] font-mono text-white/35 uppercase tracking-widest mb-2">Active Agents</p>
          <div className="flex flex-wrap gap-1.5">
            {data!.activeAgents.map(agent => (
              <span
                key={agent}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono"
                style={{ background: 'rgba(139,0,255,0.15)', border: '1px solid rgba(139,0,255,0.3)', color: '#d8aaff' }}
              >
                {AGENT_ICONS[agent] || '🤖'} {agent.replace(' Agent', '')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="px-6 py-3 border-b border-white/8">
        <p className="text-[10px] font-mono text-white/35 uppercase tracking-widest mb-3">Recent Activity</p>
        <div className="space-y-1.5">
          {(data?.recentActivity || []).slice(0, 5).map(act => (
            <div key={act.id} className="flex items-start gap-2">
              <span className="text-xs mt-0.5 shrink-0">{AGENT_ICONS[act.actor] || '⚡'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white/60 truncate">{act.action}</p>
                <p className="text-[10px] text-white/30">{timeAgo(act.createdAt)}</p>
              </div>
              <span
                className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 ${
                  act.status === 'Success' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                }`}
              >
                {act.status}
              </span>
            </div>
          ))}
          {(data?.recentActivity || []).length === 0 && (
            <p className="text-[11px] text-white/30 italic">No activity yet — trigger the pipeline to start.</p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-6 py-3 border-b border-white/8 grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-base font-bold text-white">{data?.pendingTasks || 0}</p>
          <p className="text-[9px] text-white/35 uppercase tracking-widest">Pending</p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-green-400">{data?.completedTasks || 0}</p>
          <p className="text-[9px] text-white/35 uppercase tracking-widest">Completed</p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-purple-400">{data?.totalProposals || 0}</p>
          <p className="text-[9px] text-white/35 uppercase tracking-widest">Proposals</p>
        </div>
      </div>

      {/* Run Result */}
      <AnimatePresence>
        {runResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 py-3 border-b border-white/8 bg-purple-900/10"
          >
            <div className="flex items-center gap-2 mb-2">
              {runResult.errors.length === 0 ? (
                <CheckCircle2 size={13} className="text-green-400" />
              ) : (
                <AlertCircle size={13} className="text-yellow-400" />
              )}
              <span className="text-[11px] text-white/70">
                Pipeline completed — {runResult.leadsProcessed} leads processed in {runResult.durationMs}ms
              </span>
            </div>
            {runResult.actionsExecuted.slice(0, 4).map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] text-white/50">
                <ChevronRight size={9} className="text-purple-400 shrink-0" />
                {a}
              </div>
            ))}
          </motion.div>
        )}
        {briefResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 py-3 border-b border-white/8 bg-blue-900/10"
          >
            <p className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-1">Daily Brief Preview</p>
            <p className="text-[11px] text-white/50 line-clamp-3">{briefResult}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="px-6 py-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={triggerPipeline}
          disabled={running}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-mono font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
          style={{
            background: running ? 'rgba(139,0,255,0.1)' : 'rgba(139,0,255,0.2)',
            border: '1px solid rgba(139,0,255,0.4)',
            color: '#d8aaff'
          }}
        >
          {running ? (
            <RefreshCw size={11} className="animate-spin" />
          ) : (
            <Play size={11} />
          )}
          {running ? 'Running...' : 'Run Pipeline'}
        </button>

        <button
          type="button"
          onClick={triggerDailyBrief}
          disabled={briefLoading}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-mono font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
          style={{
            background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.3)',
            color: '#67e8f9'
          }}
        >
          {briefLoading ? (
            <RefreshCw size={11} className="animate-spin" />
          ) : (
            <Brain size={11} />
          )}
          {briefLoading ? 'Generating...' : 'Daily Brief'}
        </button>
      </div>

      <div className="px-6 pb-4">
        <p className="text-[9px] font-mono text-white/20 text-center">
          Auto-runs every 30 min · Daily brief at 10PM · Cron via Vercel
        </p>
      </div>
    </motion.div>
  );
}
