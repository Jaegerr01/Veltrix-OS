'use client';

import React from 'react';
import Link from 'next/link';
import { StatCard, AgentCard } from '@/components/ds';
import { AGENT_ICONS } from '@/components/ds/agents';
import ApprovalQueue from '@/components/ApprovalQueue';
import GoalCascadePanel from '@/components/GoalCascadePanel';
import { useAgentRoster } from '@/components/useAgentRoster';
import { db } from '@/lib/db';
import type { Lead, OutreachMessage, Followup, Proposal, AgentLog } from '@/lib/types';
import { asErr } from '@/lib/errors';
import dynamic from 'next/dynamic';

const ScraperControl = dynamic(() => import('@/components/ScraperControl'), { ssr: false });

/**
 * Command Center. Every number on this page is computed from the database at load time.
 * While loading, or if a read fails, tiles show "-" / an explicit error - never a placeholder number.
 */

const cmdCard: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
};

const STAGES: Array<{ label: string; statuses: string[]; color: string }> = [
  { label: 'New', statuses: ['New', 'Researched'], color: 'var(--cyan-300)' },
  { label: 'Qualified', statuses: ['Qualified'], color: 'var(--cyan-300)' },
  { label: 'Contacted', statuses: ['Contacted'], color: 'var(--text-strong)' },
  { label: 'Replied', statuses: ['Replied'], color: 'var(--violet-300)' },
  { label: 'Booked', statuses: ['Call Booked'], color: 'var(--text-strong)' },
  { label: 'Proposal', statuses: ['Proposal Sent'], color: 'var(--text-strong)' },
  { label: 'Won', statuses: ['Won'], color: 'var(--signal-400)' },
  { label: 'Lost', statuses: ['Lost'], color: 'var(--text-strong)' },
];

const isProvenSend = (r: { status: string; provider?: string | null; provider_message_id?: string | null }) =>
  r.status === 'Sent' && !!r.provider_message_id && r.provider !== 'manual';

const telemetryDot = (status?: string) => (status === 'Failure' || status === 'Failed' ? 'var(--danger-400)' : status === 'Pending Approval' ? 'var(--warn-400)' : 'var(--signal-400)');

export default function CommandCenterPage() {
  const { agents, error: rosterError } = useAgentRoster();
  const [leads, setLeads] = React.useState<Lead[] | null>(null);
  const [outreach, setOutreach] = React.useState<OutreachMessage[]>([]);
  const [followups, setFollowups] = React.useState<Followup[]>([]);
  const [proposals, setProposals] = React.useState<Proposal[]>([]);
  const [logs, setLogs] = React.useState<AgentLog[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [l, o, f, p, a] = await Promise.all([db.getLeads(), db.getOutreachMessages(), db.getFollowups(), db.getProposals(), db.getAgentLogs()]);
        if (!live) return;
        setLeads(l); setOutreach(o); setFollowups(f); setProposals(p); setLogs(a.slice(0, 12));
      } catch (eRaw: unknown) { const e = asErr(eRaw); if (live) setError(`Could not load live data: ${e?.message || e}`); }
    })();
    return () => { live = false; };
  }, []);

  const n = (v: number | null | undefined) => (leads === null ? '-' : String(v ?? 0));
  const stageCount = (statuses: string[]) => (leads ? leads.filter(l => statuses.includes(l.status)).length : null);
  const sentProof = outreach.filter(isProvenSend).length + followups.filter(isProvenSend).length + proposals.filter(isProvenSend).length;
  const proposalsOut = proposals.filter(p => isProvenSend(p) || p.status === 'Viewed');
  const proposalValue = proposalsOut.reduce((s, p) => s + (p.price || 0), 0);
  const notSent = outreach.filter(m => ['Draft', 'Approved', 'Sending', 'Failed'].includes(m.status)).length
    + followups.filter(f => ['Pending', 'Drafted', 'Approved', 'Sending', 'Failed'].includes(f.status)).length
    + proposals.filter(p => ['Draft', 'Pending Approval', 'Approved', 'Sending', 'Failed'].includes(p.status)).length;

  return (
    <>
      {error && <div role="alert" style={{ ...cmdCard, color: 'var(--danger-400)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{error}</div>}

      <ApprovalQueue />

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', alignItems: 'stretch' }}>
        <GoalCascadePanel />
        <ScraperControl />
      </section>

      {/* Live Data */}
      <section className="vx-glass" style={cmdCard}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
          <div>
            <div className="vx-eyebrow" style={{ color: 'var(--cyan-300)' }}>Live Data</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', marginTop: 4 }}>Lead Pipeline</div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>{leads === null ? 'loading…' : `${leads.length} leads total`}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 'var(--space-3)' }}>
          {STAGES.map((s) => (
            <div key={s.label} style={{ padding: 'var(--space-4) var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--ink-700)', border: '1px solid var(--hairline)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1 }}>{n(stageCount(s.statuses))}</div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* KPI row - real counts only */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-5)' }}>
        <StatCard label="Confirmed sent" value={leads === null ? '-' : sentProof} accent="cyan" />
        <StatCard label="Not sent yet" value={leads === null ? '-' : notSent} accent="violet" />
        <StatCard label="Proposals out" value={leads === null ? '-' : proposalsOut.length} unit={proposalValue ? `$${proposalValue.toLocaleString()}` : ''} accent="blue" />
        <StatCard label="Calls booked" value={n(stageCount(['Call Booked']))} accent="magenta" />
      </section>

      {/* Agent Roster + Live Telemetry */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 'var(--space-6)', alignItems: 'stretch' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
            <div>
              <div className="vx-eyebrow" style={{ color: 'var(--violet-300)', marginBottom: 6 }}>Workforce</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-strong)' }}>Agent Roster</div>
            </div>
            <Link href="/ceo" className="vx-tap" style={{ fontSize: 12, color: 'var(--cyan-300)', fontFamily: 'var(--font-mono)' }}>Give the CEO an instruction →</Link>
          </div>
          {rosterError && <div style={{ color: 'var(--danger-400)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 8 }}>{rosterError}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }}>
            {agents.map((a, i) => (
              <AgentCard key={a.id} agent={{ ...a, iconName: AGENT_ICONS[a.id] ?? 'sparkle' }} index={i} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 'var(--space-4)' }}>Live Telemetry</div>
          <div className="vx-glass" style={{ ...cmdCard, padding: 0, overflow: 'hidden' }}>
            {logs.length === 0 && (
              <div style={{ padding: 'var(--space-6)', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                No agent activity recorded yet.
              </div>
            )}
            {logs.map((row) => (
              <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '54px 1fr', columnGap: 12, padding: '10px 14px', borderBottom: '1px solid var(--hairline)', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                  {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--text-body)', wordBreak: 'break-word' }}>
                  <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: telemetryDot(row.status), marginRight: 8 }} />
                  <b>{row.agent_name || row.actor || 'system'}</b> - {row.action}{row.status ? ` (${row.status})` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
