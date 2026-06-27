import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: string;
  trendPositive?: boolean;
  borderAccent?: 'purple' | 'cyan' | 'pink' | 'green' | 'orange';
}

const accentMap = {
  purple: {
    icon: 'text-neon-purple bg-neon-purple/10',
    glow: 'hover:shadow-[0_12px_40px_rgba(168,85,247,0.22),0_0_0_1px_rgba(168,85,247,0.18)] hover:border-neon-purple/30',
    topLine: 'rgba(168,85,247,0.7)',
  },
  cyan: {
    icon: 'text-neon-cyan bg-neon-cyan/10',
    glow: 'hover:shadow-[0_12px_40px_rgba(6,182,212,0.22),0_0_0_1px_rgba(6,182,212,0.18)] hover:border-neon-cyan/30',
    topLine: 'rgba(6,182,212,0.7)',
  },
  pink: {
    icon: 'text-neon-pink bg-neon-pink/10',
    glow: 'hover:shadow-[0_12px_40px_rgba(236,72,153,0.22),0_0_0_1px_rgba(236,72,153,0.18)] hover:border-neon-pink/30',
    topLine: 'rgba(236,72,153,0.65)',
  },
  green: {
    icon: 'text-neon-green bg-neon-green/10',
    glow: 'hover:shadow-[0_12px_40px_rgba(16,185,129,0.22),0_0_0_1px_rgba(16,185,129,0.18)] hover:border-neon-green/30',
    topLine: 'rgba(16,185,129,0.65)',
  },
  orange: {
    icon: 'text-neon-orange bg-neon-orange/10',
    glow: 'hover:shadow-[0_12px_40px_rgba(249,115,22,0.22),0_0_0_1px_rgba(249,115,22,0.18)] hover:border-neon-orange/30',
    topLine: 'rgba(249,115,22,0.65)',
  },
};

export default function DashboardCard({ title, value, icon, description, trend, trendPositive = true, borderAccent = 'purple' }: DashboardCardProps) {
  const accent = accentMap[borderAccent];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      className={`relative p-5 rounded-2xl bg-[rgba(12,12,20,0.55)] backdrop-blur-2xl border border-white/[0.08] flex flex-col justify-between h-36 cursor-pointer transition-all duration-300 overflow-hidden shimmer-hover ${accent.glow}`}
      style={{
        boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.07), 0 16px 40px rgba(0,0,0,0.45)',
      }}
    >
      {/* Gradient top accent line */}
      <div
        className="absolute top-0 left-[12%] right-[12%] h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${accent.topLine}, transparent)` }}
      />

      {/* Diagonal highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.035] to-transparent pointer-events-none rounded-2xl" />

      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-white/35 uppercase tracking-[0.18em] block">{title}</span>
          <span className="text-[27px] font-bold font-mono text-white leading-none tracking-tight">{value}</span>
        </div>
        <motion.div
          whileHover={{ scale: 1.12, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={`p-2.5 rounded-xl ${accent.icon}`}
        >
          {icon}
        </motion.div>
      </div>

      <div className="flex items-center justify-between relative z-10">
        <span className="text-[11px] text-white/38 truncate max-w-[65%] font-sans">{description}</span>
        {trend && (
          <span className={`flex items-center gap-1 font-mono text-[10px] font-semibold ${trendPositive ? 'text-neon-green' : 'text-neon-pink'}`}>
            {trendPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
}
