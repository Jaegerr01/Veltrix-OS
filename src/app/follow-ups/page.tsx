'use client';

import React from 'react';
import { PageHeaderCard, VxIcon } from '@/components/ds';

/**
 * Follow-ups — ported from the "isFollowups" view of the design prototype:
 * header with DUE / COMPLETED counts, an empty follow-up schedule + log, and
 * the "Create Follow-up Draft" composer (lead + day selectors).
 */

const cmdCard: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
};
const selectStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 12px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--ink-700)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-strong)',
  fontFamily: 'var(--font-body)',
  fontSize: 13.5,
  outline: 'none',
  appearance: 'none',
  cursor: 'pointer',
};

const LEAD_OPTIONS = ['Select a prospect…', '5 Star Dental Care', 'The Dental Center of Nevada', 'Bright Smile Austin', 'Nordic Retail'];
const DAY_OPTIONS = ['Day 3: Friendly check-in', 'Day 7: Value drop', 'Day 14: Close-out', 'Day 30: Re-engage'];

export default function FollowUpsPage() {
  const [lead, setLead] = React.useState('');
  const [day, setDay] = React.useState(DAY_OPTIONS[0]);

  return (
    <>
      <PageHeaderCard
        icon="refresh"
        title="Follow-ups"
        subtitle="Lucas keeps contacted leads warm — Day 3 nudge, Day 7 value, Day 14 close-out, Day 30 re-engage."
        stats={[
          { value: '0', label: 'DUE', color: 'var(--warn-400)' },
          { value: '0', label: 'COMPLETED', color: 'var(--signal-400)' },
        ]}
      />

      <section style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="vx-glass" style={cmdCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-5)' }}>
              <span style={{ color: 'var(--magenta-300)', display: 'flex' }}>
                <VxIcon name="calendar" size={18} />
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--magenta-300)', textTransform: 'uppercase' }}>Follow-up Schedule</span>
            </div>
            <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--text-dim)', fontSize: 12.5, fontFamily: 'var(--font-mono)' }}>No pending follow-up reminders at this time.</div>
          </div>
          <div className="vx-glass" style={cmdCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-5)' }}>
              <span style={{ color: 'var(--signal-400)', display: 'flex' }}>
                <VxIcon name="check" size={18} />
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--signal-400)', textTransform: 'uppercase' }}>Completed Follow-ups Log</span>
            </div>
            <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--text-dim)', fontSize: 12.5, fontFamily: 'var(--font-mono)' }}>No follow-ups have been completed yet.</div>
          </div>
        </div>

        <div
          className="vx-glass"
          style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(155deg, rgba(217,70,239,0.06), rgba(10,7,26,0.5))', border: '1px solid rgba(217,70,239,0.22)', boxShadow: 'var(--shadow-lg), var(--sheen-top)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-5)' }}>
            <span style={{ color: 'var(--magenta-300)', display: 'flex' }}>
              <VxIcon name="refresh" size={18} />
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--magenta-300)', textTransform: 'uppercase' }}>Create Follow-up Draft</span>
          </div>
          <div className="vx-eyebrow" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Select Potential Client (Lead)</div>
          <select value={lead} onChange={(e) => setLead(e.target.value)} style={selectStyle}>
            {LEAD_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <div className="vx-eyebrow" style={{ color: 'var(--text-muted)', margin: 'var(--space-5) 0 8px' }}>Select Follow-up Day</div>
          <select value={day} onChange={(e) => setDay(e.target.value)} style={selectStyle}>
            {DAY_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', padding: '14px 0', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #D946EF, #8B5CF6)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 0 22px rgba(217,70,239,0.4)' }}>
            Create Draft with AI
          </div>
        </div>
      </section>
    </>
  );
}
