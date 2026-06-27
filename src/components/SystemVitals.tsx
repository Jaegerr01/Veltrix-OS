'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Users, DollarSign, CheckSquare, Zap } from 'lucide-react';

interface Props {
  targetRevenue: number;
  closedRevenue: number;
  pipelineValue: number;
  leadCount: number;
  taskCount: number;
  bhagLabel?: string;
}

export default function SystemVitals({
  targetRevenue,
  closedRevenue,
  pipelineValue,
  leadCount,
  taskCount,
  bhagLabel = 'ROAD TO $100,000',
}: Props) {
  const totalProgress  = closedRevenue + pipelineValue;
  const bhagTarget     = 100_000;
  const bhagPct        = Math.min(Math.round((totalProgress / bhagTarget) * 100), 100);
  const monthlyPct     = targetRevenue > 0 ? Math.min(Math.round((closedRevenue / targetRevenue) * 100), 100) : 0;

  const vitals = [
    { label: 'Closed MRR',  value: `$${closedRevenue.toLocaleString()}`,  icon: <DollarSign size={13} />, color: 'text-neon-green'  },
    { label: 'Pipeline',    value: `$${pipelineValue.toLocaleString()}`,   icon: <Zap size={13} />,        color: 'text-neon-cyan'   },
    { label: 'Active Leads',value: leadCount.toString(),                   icon: <Users size={13} />,      color: 'text-neon-purple' },
    { label: 'Open Tasks',  value: taskCount.toString(),                   icon: <CheckSquare size={13} />,color: 'text-neon-pink'   },
  ];

  return (
    <div className="rounded-2xl bg-[rgba(13,13,22,0.55)] backdrop-blur-xl border border-white/[0.07] p-5 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.18em]">System</p>
          <h3 className="text-[15px] font-bold text-white mt-1">System Vitals</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-neon-green">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse-glow" />
          ALL SYSTEMS LIVE
        </div>
      </div>

      {/* 4 metric chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {vitals.map(v => (
          <div key={v.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-1.5">
            <div className={`flex items-center gap-1.5 ${v.color}`}>
              {v.icon}
              <span className="text-[9px] font-mono uppercase tracking-wider text-white/30">{v.label}</span>
            </div>
            <span className={`text-[18px] font-bold font-mono ${v.color} leading-none`}>{v.value}</span>
          </div>
        ))}
      </div>

      {/* Monthly target bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-white/30 uppercase tracking-wider">Monthly Target</span>
          <span className="text-neon-cyan font-semibold">{monthlyPct}% — ${closedRevenue.toLocaleString()} / ${targetRevenue.toLocaleString()}</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${monthlyPct}%` }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-cyan"
          />
        </div>
      </div>

      {/* BHAG bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <Target size={10} className="text-neon-pink" />
            <span className="text-neon-pink font-bold tracking-wider">{bhagLabel}</span>
          </div>
          <span className="text-white/40">{bhagPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${bhagPct}%` }}
            transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
            className="h-full rounded-full bg-gradient-to-r from-neon-pink to-neon-orange"
          />
        </div>
        <p className="text-[9px] font-mono text-white/20">
          ${totalProgress.toLocaleString()} tracked towards ${bhagTarget.toLocaleString()} BHAG
        </p>
      </div>

    </div>
  );
}
