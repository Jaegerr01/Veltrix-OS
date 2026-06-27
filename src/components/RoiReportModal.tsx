'use client';

import React, { useState } from 'react';
import { X, TrendingUp, Calendar, CheckSquare, DollarSign, BarChart2, Zap, Send, Loader2 } from 'lucide-react';
import { Client } from '@/lib/types';

interface RoiMetrics {
  setup_paid: number;
  monthly_retainer: number;
  months_active: number;
  retainer_total: number;
  lifetime_value: number;
  tasks_total: number;
  tasks_completed: number;
  completion_rate: number;
  project_status: string;
  estimated_monthly_saving: number;
  estimated_roi_pct: number;
}

interface RoiReport {
  client: Client;
  metrics: RoiMetrics;
  narrative: string;
  generated_at: string;
}

interface Props {
  report: RoiReport;
  onClose: () => void;
  onSendEmail: () => Promise<void>;
  canSendEmail: boolean;
}

export default function RoiReportModal({ report, onClose, onSendEmail, canSendEmail }: Props) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { client, metrics, narrative, generated_at } = report;

  const handleSend = async () => {
    if (sending || sent) return;
    setSending(true);
    try {
      await onSendEmail();
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  const roiColor = metrics.estimated_roi_pct >= 0 ? 'text-neon-green' : 'text-neon-pink';
  const roiBg = metrics.estimated_roi_pct >= 0 ? 'bg-neon-green/10 border-neon-green/20' : 'bg-neon-pink/10 border-neon-pink/20';

  const statCards = [
    {
      label: 'Total Investment',
      value: `$${metrics.lifetime_value.toLocaleString()}`,
      sub: `$${metrics.setup_paid.toLocaleString()} setup${metrics.monthly_retainer > 0 ? ` + $${metrics.monthly_retainer}/mo` : ''}`,
      icon: DollarSign,
      color: 'text-neon-cyan',
      bg: 'bg-neon-cyan/5 border-neon-cyan/15',
    },
    {
      label: 'Months Active',
      value: String(metrics.months_active),
      sub: 'since onboarding',
      icon: Calendar,
      color: 'text-neon-purple',
      bg: 'bg-neon-purple/5 border-neon-purple/15',
    },
    {
      label: 'Milestones Done',
      value: `${metrics.completion_rate}%`,
      sub: `${metrics.tasks_completed} of ${metrics.tasks_total} tasks`,
      icon: CheckSquare,
      color: 'text-neon-green',
      bg: 'bg-neon-green/5 border-neon-green/15',
    },
    {
      label: 'Project Status',
      value: metrics.project_status,
      sub: client.service_purchased || 'AI Solution',
      icon: BarChart2,
      color: 'text-amber-400',
      bg: 'bg-amber-400/5 border-amber-400/15',
    },
    {
      label: 'Est. Monthly Value',
      value: `~$${metrics.estimated_monthly_saving.toLocaleString()}`,
      sub: 'generated per month',
      icon: Zap,
      color: 'text-neon-green',
      bg: 'bg-neon-green/5 border-neon-green/15',
    },
    {
      label: 'Projected ROI',
      value: `${metrics.estimated_roi_pct >= 0 ? '+' : ''}${metrics.estimated_roi_pct}%`,
      sub: 'on total investment',
      icon: TrendingUp,
      color: roiColor,
      bg: roiBg,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neon-purple/30 bg-[#0A0A0F] shadow-[0_0_60px_rgba(168,85,247,0.15)]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between p-6 border-b border-white/5 bg-[#0A0A0F]">
          <div>
            <div className="flex items-center space-x-2 text-neon-purple mb-1">
              <TrendingUp size={16} />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Client ROI Report</span>
            </div>
            <h2 className="text-lg font-bold text-foreground">{client.business_name}</h2>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              Generated {new Date(generated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {' · '}AI estimates based on engagement data
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className={`p-3 rounded-xl border ${card.bg} flex flex-col space-y-1`}
                >
                  <div className="flex items-center space-x-1.5">
                    <Icon size={12} className={card.color} />
                    <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                      {card.label}
                    </span>
                  </div>
                  <span className={`text-base font-bold font-mono ${card.color}`}>{card.value}</span>
                  <span className="text-[10px] text-muted-foreground">{card.sub}</span>
                </div>
              );
            })}
          </div>

          {/* AI Narrative */}
          <div className="rounded-xl border border-neon-purple/20 bg-neon-purple/5 p-5">
            <div className="flex items-center space-x-2 mb-3">
              <Zap size={13} className="text-neon-purple" />
              <span className="font-mono text-[10px] text-neon-purple uppercase tracking-wider">AI Value Summary</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed font-sans whitespace-pre-line">
              {narrative}
            </p>
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-muted-foreground font-mono">
            * ROI figures are AI estimates based on industry benchmarks for {client.service_purchased || 'AI services'}.
            Actual results vary. Contact VELTRIX to discuss tracked performance metrics.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-white/5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-muted-foreground hover:text-foreground border border-white/10 hover:bg-white/5 rounded-lg transition cursor-pointer"
            >
              Close
            </button>
            {canSendEmail && (
              <button
                onClick={handleSend}
                disabled={sending || sent}
                className="flex items-center space-x-2 px-4 py-2 bg-neon-purple hover:bg-neon-purple/80 text-white rounded-lg font-mono font-bold text-xs transition cursor-pointer disabled:opacity-60"
              >
                {sending ? (
                  <><Loader2 size={13} className="animate-spin" /><span>SENDING...</span></>
                ) : sent ? (
                  <><span>✓ SENT</span></>
                ) : (
                  <><Send size={13} /><span>EMAIL TO CLIENT</span></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
