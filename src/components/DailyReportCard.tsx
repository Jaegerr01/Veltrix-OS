import React from 'react';
import { DailyReport } from '@/lib/types';
import { ClipboardList, ArrowUpRight, AlertCircle, FileCode, CheckSquare, Sparkles } from 'lucide-react';

interface DailyReportCardProps {
  report: DailyReport;
}

export default function DailyReportCard({ report }: DailyReportCardProps) {
  return (
    <div className="glass-panel border border-white/5 rounded-xl bg-cyber-bg/30 p-6 space-y-5 hover:border-neon-purple/20 scanlines">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-white/5">
        <div className="flex items-center space-x-2.5 text-neon-purple">
          <ClipboardList size={18} />
          <h4 className="font-mono text-sm font-bold uppercase tracking-wider">
            VELTRIX Daily Command Report
          </h4>
        </div>
        <span className="font-mono text-xs font-bold text-neon-purple bg-neon-purple/10 px-2 py-0.5 rounded">
          {new Date(report.report_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Financial calculations */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-3 bg-white/3 border border-white/5 rounded-lg text-center">
          <span className="text-[10px] text-muted-foreground block uppercase">Revenue Target</span>
          <span className="text-sm font-bold text-foreground">${report.revenue_target.toLocaleString()}</span>
        </div>
        <div className="p-3 bg-neon-green/5 border border-neon-green/10 rounded-lg text-center">
          <span className="text-[10px] text-muted-foreground block uppercase">Closed Revenue</span>
          <span className="text-sm font-bold text-neon-green">${report.closed_revenue.toLocaleString()}</span>
        </div>
        <div className="p-3 bg-neon-cyan/5 border border-neon-cyan/10 rounded-lg text-center">
          <span className="text-[10px] text-muted-foreground block uppercase">Pipeline Value</span>
          <span className="text-sm font-bold text-neon-cyan">${report.pipeline_value.toLocaleString()}</span>
        </div>
        <div className="p-3 bg-neon-pink/5 border border-neon-pink/10 rounded-lg text-center">
          <span className="text-[10px] text-muted-foreground block uppercase">Revenue Gap</span>
          <span className="text-sm font-bold text-neon-pink">${report.revenue_gap.toLocaleString()}</span>
        </div>
      </div>

      {/* Top Priority */}
      {report.top_priority && (
        <div className="p-4 bg-neon-purple/5 border border-neon-purple/20 rounded-lg space-y-1.5">
          <div className="flex items-center space-x-1.5 text-neon-purple font-mono text-[10px] font-bold uppercase tracking-wider">
            <CheckSquare size={13} />
            <span>Today’s Top Priority</span>
          </div>
          <p className="text-xs text-foreground font-sans leading-relaxed select-text">{report.top_priority}</p>
        </div>
      )}

      {/* Leads to contact & Follow-ups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Leads */}
        <div className="p-4 bg-white/2 border border-white/5 rounded-lg space-y-2">
          <div className="flex items-center space-x-1.5 text-neon-cyan font-mono text-[10px] font-bold uppercase tracking-wider">
            <ArrowUpRight size={13} />
            <span>Leads to Contact</span>
          </div>
          {report.leads_to_contact && report.leads_to_contact.length > 0 ? (
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground font-sans">
              {report.leads_to_contact.map((lead, i) => (
                <li key={i} className="select-text">
                  <span className="text-foreground font-semibold">{lead}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">No leads queued</p>
          )}
        </div>

        {/* Followups */}
        <div className="p-4 bg-white/2 border border-white/5 rounded-lg space-y-2">
          <div className="flex items-center space-x-1.5 text-neon-pink font-mono text-[10px] font-bold uppercase tracking-wider">
            <AlertCircle size={13} />
            <span>Follow-ups Due</span>
          </div>
          {report.followups_due && report.followups_due.length > 0 ? (
            <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground font-sans">
              {report.followups_due.map((fup, i) => (
                <li key={i} className="select-text">
                  <span className="text-foreground">{fup}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">No follow-ups queued</p>
          )}
        </div>
      </div>

      {/* Content to post & Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Content */}
        {report.content_to_post && (
          <div className="p-4 bg-white/2 border border-white/5 rounded-lg space-y-2">
            <div className="flex items-center space-x-1.5 text-neon-green font-mono text-[10px] font-bold uppercase tracking-wider">
              <FileCode size={13} />
              <span>Content to Post</span>
            </div>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed select-text">{report.content_to_post}</p>
          </div>
        )}

        {/* Action & Strategy */}
        {report.recommended_action && (
          <div className="p-4 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg space-y-2">
            <div className="flex items-center space-x-1.5 text-neon-cyan font-mono text-[10px] font-bold uppercase tracking-wider">
              <Sparkles size={13} />
              <span>Recommended Action</span>
            </div>
            <p className="text-xs text-foreground font-sans leading-relaxed font-medium select-text">{report.recommended_action}</p>
          </div>
        )}
      </div>
    </div>
  );
}
