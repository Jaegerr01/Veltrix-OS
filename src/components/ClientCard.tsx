'use client';

import React, { useState } from 'react';
import { Client } from '@/lib/types';
import StatusBadge from './StatusBadge';
import RoiReportModal from './RoiReportModal';
import { Briefcase, Mail, Phone, ExternalLink, DollarSign, TrendingUp, Loader2 } from 'lucide-react';

interface ClientCardProps {
  client: Client;
}

export default function ClientCard({ client }: ClientCardProps) {
  const [loadingReport, setLoadingReport] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleRoiReport = async () => {
    if (loadingReport) return;
    setLoadingReport(true);
    try {
      const res = await fetch('/api/ai/roi-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id }),
      });
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      } else {
        alert(data.error || 'Failed to generate ROI report.');
      }
    } catch (err) {
      console.warn('ROI report generation failed:', err);
      alert('Failed to reach the server. Please try again.');
    } finally {
      setLoadingReport(false);
    }
  };

  const handleSendEmail = async () => {
    const res = await fetch('/api/ai/roi-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: client.id, sendEmail: true }),
    });
    const data = await res.json();
    if (!data.emailDelivered) {
      alert(
        data.error ||
          'Email could not be sent. Check that RESEND_API_KEY and RESEND_FROM_EMAIL are set in .env.local.'
      );
    }
  };

  return (
    <>
      <div className="glass-panel border border-white/5 rounded-xl bg-cyber-bg/30 p-5 flex flex-col justify-between hover:border-neon-cyan/20">
        <div>
          {/* Name Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2 text-neon-cyan">
              <Briefcase size={16} />
              <h4 className="text-sm font-semibold text-foreground truncate max-w-[150px]">{client.business_name}</h4>
            </div>
            <StatusBadge status={client.status} />
          </div>

          {/* Contact info */}
          <div className="space-y-1 text-[11px] text-muted-foreground my-3 font-sans">
            {client.contact_name && <p className="font-semibold text-foreground">Contact: {client.contact_name}</p>}
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex items-center space-x-1 hover:text-foreground">
                <Mail size={11} />
                <span className="truncate">{client.email}</span>
              </a>
            )}
            {client.phone && (
              <div className="flex items-center space-x-1">
                <Phone size={11} />
                <span>{client.phone}</span>
              </div>
            )}
            {client.website && (
              <a
                href={client.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 hover:text-neon-cyan font-mono text-[10px]"
              >
                <ExternalLink size={11} />
                <span className="truncate">{client.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
              </a>
            )}
          </div>

          {/* Purchased deliverables */}
          <div className="my-2 p-2 bg-white/2 rounded border border-white/5 text-xs text-foreground font-sans">
            <span className="text-[9px] text-muted-foreground block uppercase font-mono tracking-wider">Service Purchased:</span>
            <span className="font-medium">{client.service_purchased || 'Technology Integrations'}</span>
          </div>
        </div>

        {/* Finance totals footer */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 mt-4 font-mono text-[11px]">
          <div className="p-2 bg-neon-green/5 border border-neon-green/10 rounded">
            <span className="text-[9px] text-muted-foreground block uppercase">Total value</span>
            <div className="flex items-center text-neon-green font-bold">
              <DollarSign size={11} />
              <span>{client.total_value.toLocaleString()}</span>
            </div>
          </div>
          <div className="p-2 bg-neon-purple/5 border border-neon-purple/10 rounded">
            <span className="text-[9px] text-muted-foreground block uppercase">Monthly Retainer</span>
            <div className="flex items-center text-neon-purple font-bold">
              <DollarSign size={11} />
              <span>{client.monthly_retainer > 0 ? `${client.monthly_retainer}/mo` : '$0'}</span>
            </div>
          </div>
        </div>

        {/* ROI Report button */}
        <button
          onClick={handleRoiReport}
          disabled={loadingReport}
          className="mt-4 w-full flex items-center justify-center space-x-2 py-2 rounded-lg border border-neon-purple/30 bg-neon-purple/5 hover:bg-neon-purple/10 text-neon-purple font-mono font-bold text-[10px] uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
        >
          {loadingReport ? (
            <><Loader2 size={12} className="animate-spin" /><span>Generating...</span></>
          ) : (
            <><TrendingUp size={12} /><span>ROI Report</span></>
          )}
        </button>
      </div>

      {/* ROI Report Modal */}
      {report && (
        <RoiReportModal
          report={report}
          onClose={() => setReport(null)}
          onSendEmail={handleSendEmail}
          canSendEmail={!!client.email}
        />
      )}
    </>
  );
}
