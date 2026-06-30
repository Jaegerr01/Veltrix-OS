'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { useRealtime } from '@/hooks/useRealtime';
import { Lead, Task, BusinessProfile, DailyReport, Revenue, Proposal, Followup, AgentLog } from '@/lib/types';
import { AGENTS } from '@/lib/agents/agents';
import StatusBadge from '@/components/StatusBadge';
import LeadScoreBadge from '@/components/LeadScoreBadge';
import RevenueProgress from '@/components/RevenueProgress';
import { motion, Variants } from 'framer-motion';
import {
  TrendingUp, Users, Trophy, Clock, Sparkles, CheckSquare,
  ArrowRight, Plus, Cpu, DollarSign, Target, Terminal, Play,
  FileText, RefreshCw, Send, Check,
  BrainCircuit, FileCode, Search, Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import CommandDeck from '@/components/CommandDeck';
import SystemVitals from '@/components/SystemVitals';
import { AutonomyStatus } from '@/components/AutonomyStatus';
import CircularProgress from '@/components/CircularProgress';
import Sparkline from '@/components/Sparkline';
import PendingCard from '@/components/PendingCard';

// ─── Agent icons map ──────────────────────────────────────────────────────────
const agentIcons: Record<string, React.ReactNode> = {
  ceo:          <Sparkles  size={15} />,
  revenue:      <DollarSign size={15} />,
  sales:        <Target    size={15} />,
  leadResearch: <Search    size={15} />,
  outreach:     <Send      size={15} />,
  followup:     <RefreshCw size={15} />,
  proposal:     <FileText  size={15} />,
  content:      <FileCode  size={15} />,
  delivery:     <Briefcase size={15} />,
  memory:       <BrainCircuit size={15} />,
};

// ─── Animation presets ────────────────────────────────────────────────────────
const container: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
};

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-[rgba(13,13,22,0.55)] backdrop-blur-xl border border-white/[0.07] ${className}`}>
      {children}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [profile,    setProfile]    = useState<BusinessProfile | null>(null);
  const [leads,      setLeads]      = useState<Lead[]>([]);
  const [tasks,      setTasks]      = useState<Task[]>([]);
  const [reports,    setReports]    = useState<DailyReport[]>([]);
  const [revenues,   setRevenues]   = useState<Revenue[]>([]);
  const [proposals,  setProposals]  = useState<Proposal[]>([]);
  const [followups,  setFollowups]  = useState<Followup[]>([]);
  const [agentLogs,  setAgentLogs]  = useState<AgentLog[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [schemaErr,  setSchemaErr]  = useState(false);
  const [checked,    setChecked]    = useState<Set<string>>(new Set());

  async function loadData() {
    try {
      const [bp, lds, tks, rps, revs, props, fups, al] = await Promise.all([
        db.getBusinessProfile(),
        db.getLeads(),
        db.getTasks(),
        db.getDailyReports(),
        db.getRevenue(),
        db.getProposals(),
        db.getFollowups(),
        db.getAgentLogs(),
      ]);
      setProfile(bp); setLeads(lds); setTasks(tks); setReports(rps);
      setRevenues(revs); setProposals(props); setFollowups(fups); setAgentLogs(al);
      setSchemaErr(db.isSchemaInvalid);
    } catch {
      setSchemaErr(true);
    } finally {
      setLoading(false);
    }
  }

  useRealtime('profiles',   loadData);
  useRealtime('leads',      loadData);
  useRealtime('tasks',      loadData);
  useRealtime('revenue',    loadData);
  useRealtime('proposals',  loadData);
  useRealtime('followups',  loadData);
  useRealtime('activities', loadData);

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full border-4 border-t-neon-purple border-white/5 w-10 h-10" />
        <span className="font-mono text-[10px] text-neon-purple animate-pulse-glow tracking-widest">LOADING DASHBOARD…</span>
      </div>
    );
  }

  // ── Computed metrics ──────────────────────────────────────────────────────
  const targetRevenue  = profile?.target_monthly_revenue ?? 6000;
  const closedRevenue  = revenues.filter(r => r.status === 'Paid').reduce((a, r) => a + Number(r.amount), 0);
  const revenueGap     = Math.max(0, targetRevenue - closedRevenue);
  const pipelineValue  = proposals.filter(p => ['Draft','Sent'].includes(p.status)).reduce((a, p) => a + Number(p.price), 0);
  const percentage     = targetRevenue > 0 ? Math.round((closedRevenue / targetRevenue) * 100) : 0;
  const bookedCalls    = leads.filter(l => l.status === 'Call Booked').length;
  const proposalsSent  = leads.filter(l => l.status === 'Proposal Sent').length;
  const dealsWon       = leads.filter(l => l.status === 'Won').length;
  const todayStr       = new Date().toISOString().split('T')[0];
  const pendingTasks   = tasks.filter(t => t.status !== 'Completed');
  const approvalQueue  = pendingTasks.filter(t => t.status === 'Pending' || t.status === 'Needs Approval');
  const tasksDueToday  = pendingTasks.filter(t => t.due_date === todayStr);
  const todayList      = tasksDueToday.length > 0 ? tasksDueToday.slice(0, 5) : pendingTasks.slice(0, 5);
  const followupsDue   = followups.filter(f => f.status === 'Pending' && f.followup_date === todayStr).length;
  const latestReport   = reports[0];
  const completedCount = tasks.filter(t => t.status === 'Completed').length;

  // Sparkline: leads per pipeline stage
  const stageData = [
    leads.filter(l => l.status === 'New').length,
    leads.filter(l => l.status === 'Contacted').length,
    leads.filter(l => l.status === 'Replied').length,
    bookedCalls,
    proposalsSent,
    dealsWon,
  ];

  // Approve / dismiss helpers
  async function approveTask(task: Task) {
    await db.updateTask(task.id, { status: 'Completed', result: 'Approved and executed.' });
    if (task.related_lead_id) {
      const outreach = await db.getOutreachMessages(task.related_lead_id);
      const draft = outreach.find((o: any) => o.status === 'Draft');
      if (draft) {
        await db.updateOutreachMessage(draft.id, { status: 'Sent', approval_status: 'Approved', sent_at: new Date().toISOString() });
        await db.updateLead(task.related_lead_id, { status: 'Contacted' });
      }
      const fups = await db.getFollowups(task.related_lead_id);
      const pFup = fups.find((f: any) => f.status === 'Pending');
      if (pFup) await db.updateFollowup(pFup.id, { status: 'Sent' });
    }
    loadData();
  }

  async function dismissTask(taskId: string) {
    await db.deleteTask(taskId);
    loadData();
  }

  async function toggleCheck(taskId: string) {
    const next = new Set(checked);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
      await db.updateTask(taskId, { status: 'Completed' });
      loadData();
    }
    setChecked(next);
  }

  return (
    <motion.div className="space-y-5 pb-14 font-sans" variants={container} initial="hidden" animate="show">

      {/* Schema sync error banner */}
      {schemaErr && (
        <motion.div
          variants={item}
          className="p-4 rounded-2xl border border-neon-pink/30 bg-neon-pink/5 text-neon-pink flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-pink opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-pink" />
            </span>
            <div>
              <span className="font-bold tracking-wider block">DB: SCHEMA OUT OF SYNC</span>
              <span className="text-white/40 text-[10px] mt-0.5 block">Run supabase_schema.sql in the Supabase SQL Editor to fix.</span>
            </div>
          </div>
          <Link href="/api/test-supabase" target="_blank" className="px-3 py-1.5 border border-neon-pink/40 hover:bg-neon-pink/20 text-neon-pink font-bold uppercase transition-all rounded text-[10px]">
            RUN DIAGNOSTICS
          </Link>
        </motion.div>
      )}

      {/* ── ROW 1: 3-column hero cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Card A: Business Overview (dark, main stats + bubble row) */}
        <motion.div variants={item}>
          <Card className="p-5 h-full flex flex-col gap-4 bg-[rgba(10,10,18,0.75)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.18em]">Overview</p>
                <h3 className="text-[15px] font-bold text-white mt-1">Business Overview</h3>
              </div>
              <div className="p-2 rounded-xl bg-neon-purple/10">
                <Sparkles size={14} className="text-neon-purple animate-pulse-glow" />
              </div>
            </div>

            <div className="flex items-end gap-5">
              <div>
                <span className="text-[38px] font-bold font-mono text-white leading-none">{completedCount}</span>
                <span className="text-[11px] text-white/35 block mt-1 font-sans">Tasks completed</span>
              </div>
              <div className="mb-1">
                <span className="text-[24px] font-bold font-mono text-neon-pink leading-none">{approvalQueue.length}</span>
                <span className="text-[11px] text-white/35 block mt-1 font-sans">Need approval</span>
              </div>
            </div>

            {/* 3 bubble stats */}
            <div className="grid grid-cols-3 gap-2 mt-auto">
              {[
                { label: 'Leads',    value: leads.length,       color: 'text-neon-cyan'   },
                { label: 'Booked',   value: bookedCalls,        color: 'text-neon-purple' },
                { label: 'Won',      value: dealsWon,           color: 'text-neon-green'  },
              ].map(s => (
                <div key={s.label} className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-center">
                  <span className={`text-[16px] font-bold font-mono ${s.color} block`}>{s.value}</span>
                  <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">{s.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Card B: Pipeline Sparkline */}
        <motion.div variants={item}>
          <Card className="p-5 h-full flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.18em]">Pipeline</p>
                <h3 className="text-[15px] font-bold text-white mt-1">Lead Funnel</h3>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/30">
                <span className="w-2 h-2 rounded-full bg-neon-purple" /> Leads
                <span className="w-2 h-2 rounded-full bg-neon-cyan ml-1" /> Won
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-end">
              <Sparkline data={stageData.length > 0 ? stageData : [0,0,0,0,0,0]} color="#a855f7" />
            </div>

            <div className="flex justify-between text-[9px] font-mono text-white/25 uppercase tracking-wider">
              {['New','Contact','Replied','Booked','Proposal','Won'].map(l => (
                <span key={l}>{l}</span>
              ))}
            </div>

            <div className="flex gap-4">
              <div>
                <span className="text-[10px] font-mono text-white/30 block">Pipeline Value</span>
                <span className="text-[15px] font-bold font-mono text-neon-cyan">${pipelineValue.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-white/30 block">Total Leads</span>
                <span className="text-[15px] font-bold font-mono text-white">{leads.length}</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Card C: Monthly Goal ring */}
        <motion.div variants={item}>
          <Card className="p-5 h-full flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.18em]">Monthly Goal</p>
                <h3 className="text-[15px] font-bold text-white mt-1">Revenue Target</h3>
              </div>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                percentage >= 100
                  ? 'text-neon-green border-neon-green/30 bg-neon-green/8'
                  : percentage >= 50
                    ? 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/8'
                    : 'text-neon-orange border-neon-orange/30 bg-neon-orange/8'
              }`}>
                {percentage >= 100 ? '✓ HIT' : percentage >= 50 ? 'ON TRACK' : 'BEHIND'}
              </span>
            </div>

            <div className="flex items-center gap-5">
              <CircularProgress percentage={percentage} />
              <div className="space-y-2.5 flex-1">
                {[
                  { label: 'Goal',     value: `$${targetRevenue.toLocaleString()}`,  dot: 'bg-white/30'       },
                  { label: 'Earned',   value: `$${closedRevenue.toLocaleString()}`,  dot: 'bg-neon-purple'    },
                  { label: 'Pipeline', value: `$${pipelineValue.toLocaleString()}`,  dot: 'bg-neon-cyan'      },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.dot}`} />
                    <span className="text-[10px] font-mono text-white/40 flex-1">{l.label}</span>
                    <span className="text-[11px] font-mono font-semibold text-white">{l.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/reports"
              className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] hover:border-neon-purple/30 bg-white/[0.03] hover:bg-neon-purple/8 text-white/50 hover:text-neon-purple text-[11px] font-mono font-semibold transition-all duration-200"
            >
              View Reports
              <ArrowRight size={11} />
            </Link>
          </Card>
        </motion.div>
      </div>

      {/* ── ROW 2: Priority Goals + Pending Actions ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Priority Goals checklist */}
        <motion.div variants={item}>
          <Card className="p-5 h-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.18em]">Priorities</p>
                <h3 className="text-[15px] font-bold text-white mt-1">Today&apos;s Goals</h3>
              </div>
              <Link href="/tasks">
                <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-neon-purple transition-colors cursor-pointer">
                  <Plus size={14} />
                </button>
              </Link>
            </div>

            <div className="space-y-2 flex-1">
              {todayList.length === 0 ? (
                <div className="py-8 text-center text-[11px] font-mono text-white/25">
                  No tasks yet — <Link href="/tasks" className="text-neon-purple hover:underline">create your first task</Link>
                </div>
              ) : (
                todayList.map(task => {
                  const done = checked.has(task.id) || task.status === 'Completed';
                  return (
                    <motion.button
                      key={task.id}
                      onClick={() => toggleCheck(task.id)}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer text-left group ${
                        done
                          ? 'bg-neon-green/5 border-neon-green/15'
                          : 'bg-white/[0.025] border-white/[0.06] hover:border-white/[0.12]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                        done
                          ? 'bg-neon-green border-neon-green'
                          : 'border-white/20 group-hover:border-neon-purple/50'
                      }`}>
                        {done && <Check size={11} className="text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[12px] font-medium block truncate transition-all ${done ? 'line-through text-white/25' : 'text-white/80'}`}>
                          {task.title}
                        </span>
                        <span className="text-[10px] font-mono text-white/25 truncate block">{task.agent_name} · {task.priority}</span>
                      </div>
                      {task.due_date && (
                        <span className="text-[9px] font-mono text-white/20 flex-shrink-0">{task.due_date}</span>
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono text-white/25">
              <span>{todayList.filter(t => checked.has(t.id) || t.status === 'Completed').length} / {todayList.length} done</span>
              <Link href="/tasks" className="hover:text-neon-purple transition-colors flex items-center gap-1">
                See all <ArrowRight size={10} />
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Pending Actions — approval queue */}
        <motion.div variants={item}>
          <Card className="p-5 h-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.18em]">Action Queue</p>
                <h3 className="text-[15px] font-bold text-white mt-1">
                  Tasks In Progress
                  <span className="ml-2 text-[11px] font-mono font-normal text-neon-purple bg-neon-purple/10 px-1.5 py-0.5 rounded-full border border-neon-purple/20">
                    {approvalQueue.length}
                  </span>
                </h3>
              </div>
              <Link href="/tasks">
                <button className="text-[10px] font-mono text-white/30 hover:text-neon-cyan transition-colors flex items-center gap-1 cursor-pointer">
                  Open archive <ArrowRight size={10} />
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 flex-1">
              {approvalQueue.slice(0, 2).map(task => (
                <PendingCard
                  key={task.id}
                  task={task}
                  onApprove={() => approveTask(task)}
                  onDismiss={() => dismissTask(task.id)}
                />
              ))}
              {approvalQueue.length === 0 && (
                <div className="col-span-2 py-8 text-center text-[11px] font-mono text-white/25">
                  ✓ Queue clear — no pending approvals
                </div>
              )}
              {/* Add task dashed card */}
              <Link href="/tasks" className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.1] hover:border-neon-purple/35 text-white/25 hover:text-neon-purple transition-all duration-200 cursor-pointer min-h-[100px]">
                <Plus size={13} />
                <span className="text-[11px] font-mono">Add task</span>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── ROW 3: Lead Pipeline Status ───────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.18em]">Live Data</p>
              <h3 className="text-[15px] font-bold text-white mt-1">Lead Pipeline</h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-white/25">
              <Clock size={11} />
              <span>Today: {tasksDueToday.length} tasks · {followupsDue} follow-ups due</span>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {[
              { label: 'Total',    value: leads.length,                                             color: 'text-white',       bg: 'bg-white/[0.04]',      border: 'border-white/[0.07]'       },
              { label: 'New',      value: leads.filter(l=>l.status==='New').length,                 color: 'text-neon-cyan',   bg: 'bg-neon-cyan/[0.06]',  border: 'border-neon-cyan/15'       },
              { label: 'Contact',  value: leads.filter(l=>l.status==='Contacted').length,           color: 'text-neon-purple', bg: 'bg-neon-purple/[0.06]',border: 'border-neon-purple/15'     },
              { label: 'Replied',  value: leads.filter(l=>l.status==='Replied').length,             color: 'text-neon-purple', bg: 'bg-neon-purple/[0.06]',border: 'border-neon-purple/15'     },
              { label: 'Booked',   value: bookedCalls,                                              color: 'text-neon-pink',   bg: 'bg-neon-pink/[0.06]',  border: 'border-neon-pink/15'       },
              { label: 'Proposal', value: proposalsSent,                                            color: 'text-neon-pink',   bg: 'bg-neon-pink/[0.06]',  border: 'border-neon-pink/15'       },
              { label: 'Won',      value: dealsWon,                                                 color: 'text-neon-green',  bg: 'bg-neon-green/[0.06]', border: 'border-neon-green/15'      },
              { label: 'Lost',     value: leads.filter(l=>l.status==='Lost').length,                color: 'text-red-400',     bg: 'bg-red-500/[0.05]',    border: 'border-red-500/[0.12]'     },
            ].map(s => (
              <div key={s.label} className={`p-3 rounded-xl ${s.bg} border ${s.border} text-center`}>
                <span className={`text-[20px] font-bold font-mono ${s.color} block leading-tight`}>{s.value}</span>
                <span className={`text-[9px] font-mono uppercase tracking-wider ${s.color} opacity-60 block mt-0.5`}>{s.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── ROW 4: AI Agents ──────────────────────────────────────────────── */}
      <motion.div variants={item} className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.18em]">Automation</p>
            <h3 className="text-[15px] font-bold text-white mt-1 flex items-center gap-2">
              <Cpu size={15} className="text-neon-purple animate-pulse-glow" />
              AI Agent Roster
            </h3>
          </div>
          <Link
            href="/command-center?tab=agents"
            className="flex items-center gap-1.5 text-[11px] font-mono text-neon-purple hover:underline bg-neon-purple/8 border border-neon-purple/20 px-3 py-1.5 rounded-xl hover:bg-neon-purple/15 transition-all duration-200"
          >
            Deploy Custom Run <ArrowRight size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.keys(AGENTS).map(key => {
            const agent = AGENTS[key];
            return (
              <motion.div
                key={key}
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="p-4 rounded-2xl bg-[rgba(13,13,22,0.6)] border border-white/[0.07] hover:border-neon-purple/30 hover:shadow-[0_6px_24px_rgba(168,85,247,0.12)] transition-all duration-300 flex flex-col gap-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-neon-purple/10 group-hover:bg-neon-purple/18 transition-colors">
                    <span className="text-neon-purple">{agentIcons[key] ?? <Cpu size={15} />}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[9px] font-mono text-neon-green">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse-glow" />
                    LIVE
                  </span>
                </div>

                <div className="flex-1">
                  <h4 className="text-[12px] font-bold text-white group-hover:text-neon-purple transition-colors duration-200 line-clamp-1">{agent.name}</h4>
                  <p className="text-[10px] text-white/30 font-mono line-clamp-2 mt-0.5">{agent.role}</p>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/[0.05]">
                  <Link href={`/command-center?ask=${key}`} className="py-1.5 rounded-lg border border-white/[0.08] hover:bg-white/5 flex items-center justify-center gap-1 text-[9px] font-mono text-white/40 hover:text-white transition-all cursor-pointer">
                    <Terminal size={9} /> Chat
                  </Link>
                  <Link href={`/command-center?tab=agents&run=${key}`} className="py-1.5 rounded-lg bg-neon-purple/10 border border-neon-purple/20 hover:bg-neon-purple/20 flex items-center justify-center gap-1 text-[9px] font-mono text-neon-purple transition-all cursor-pointer">
                    <Play size={8} /> Run
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── ROW 5: Revenue calculator (full width) ────────────────────────── */}
      <motion.div variants={item}>
        <RevenueProgress closedRevenue={closedRevenue} targetRevenue={targetRevenue} />
      </motion.div>

      {/* ── ROW 6: System Vitals + Command Deck ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <motion.div variants={item}>
          <SystemVitals
            targetRevenue={targetRevenue}
            closedRevenue={closedRevenue}
            pipelineValue={pipelineValue}
            leadCount={leads.length}
            taskCount={pendingTasks.length}
          />
        </motion.div>
        <motion.div variants={item}>
          <CommandDeck />
        </motion.div>
      </div>

      {/* ── ROW 6b: Autonomous Agency Status ──────────────────────────────── */}
      <motion.div variants={item}>
        <AutonomyStatus />
      </motion.div>

      {/* ── ROW 7: Hot Leads + Activity Feed ──────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Hot Leads — dark card list like "Last Projects" in reference */}
        <motion.div variants={item}>
          <Card className="p-5 flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.18em]">CRM</p>
                <h3 className="text-[15px] font-bold text-white mt-1">Hot Leads</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-white/25">Sort ↓</span>
                <Link href="/leads" className="text-[10px] font-mono text-neon-cyan hover:underline flex items-center gap-1">
                  See all <ArrowRight size={10} />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              {leads.length === 0 ? (
                <div className="col-span-2 py-10 text-center text-[11px] font-mono text-white/25">
                  No leads yet — <Link href="/leads" className="text-neon-cyan hover:underline">add your first lead</Link>
                </div>
              ) : (
                leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').slice(0, 4).map(lead => (
                  <div key={lead.id} className="p-4 rounded-2xl bg-[rgba(10,10,18,0.8)] border border-white/[0.07] hover:border-white/[0.13] transition-all duration-200 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <StatusBadge status={lead.status} />
                      <div className="w-7 h-7 rounded-full bg-neon-purple/15 border border-neon-purple/25 flex items-center justify-center">
                        <span className="text-[10px] font-bold font-mono text-neon-purple">{lead.lead_score}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-white leading-snug">{lead.business_name}</p>
                      <p className="text-[10px] font-mono text-white/30 mt-0.5">{lead.industry ?? 'General'} · {lead.location}</p>
                    </div>
                    <div className="pt-2.5 border-t border-white/[0.05] flex items-center justify-between">
                      <LeadScoreBadge score={lead.lead_score} />
                      <Link href="/leads" className="text-[10px] font-mono text-neon-cyan/60 hover:text-neon-cyan transition-colors">View →</Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* COS Activity Feed */}
        <motion.div variants={item}>
          <Card className="p-5 flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.18em]">Logs</p>
                <h3 className="text-[15px] font-bold text-white mt-1 flex items-center gap-2">
                  <Terminal size={13} className="text-neon-cyan animate-pulse-glow" />
                  Activity Feed
                </h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse-glow" />
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-3 pr-1 scrollbar-thin max-h-72">
              {agentLogs.length === 0 ? (
                <div className="py-12 text-center text-white/20 text-[11px]">[SYSTEM SILENT] No active logs.</div>
              ) : (
                agentLogs.slice(0, 12).map(log => {
                  const time = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={log.id} className="border-l-2 border-neon-cyan/20 pl-3 py-0.5 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-neon-cyan uppercase tracking-wider">
                          [{(log.agent_name ?? log.actor ?? 'Agent').split(' ')[0]}]
                        </span>
                        <span className="text-[9px] text-white/20">{time}</span>
                      </div>
                      <p className="text-white/55 leading-relaxed">{log.action}</p>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>
      </div>

    </motion.div>
  );
}
