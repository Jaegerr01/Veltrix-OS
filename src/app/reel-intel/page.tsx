'use client';

import React from 'react';
import { VxIcon } from '@/components/ds';

/**
 * Reel Intel — ported from the "isReelIntel" view of the design prototype:
 * a titled header with a "Nova Active" badge, the Instagram reel analyzer
 * form, and the intel history column.
 */

const cmdCard: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 14px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--ink-700)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-strong)',
  fontFamily: 'var(--font-body)',
  fontSize: 13.5,
  outline: 'none',
};
const textareaStyle: React.CSSProperties = { ...inputStyle, height: 'auto', minHeight: 92, padding: '12px 14px', resize: 'vertical', lineHeight: 1.5 };

const HISTORY = [
  { text: 'Reel Intel: The reel demonstrates Clawsmith’s AI-driven cold DM funnel converting cold IG traffic to booked calls.', time: '1d ago', tags: '#reel-intel #instagram' },
  { text: 'Reel Intel: Short-form hook formula — bold claim + on-screen proof + single CTA. Save for the dental campaign.', time: '3d ago', tags: '#hooks #shortform' },
];

export default function ReelIntelPage() {
  const [url, setUrl] = React.useState('');
  const [note, setNote] = React.useState('');
  const [analyzing, setAnalyzing] = React.useState(false);
  const t = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const analyze = () => {
    setAnalyzing(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setAnalyzing(false), 2200);
  };
  React.useEffect(() => () => clearTimeout(t.current), []);

  return (
    <>
      <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 52, height: 52, flex: '0 0 auto', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--violet-200)', background: 'rgba(139,92,246,0.14)', border: '1px solid var(--border-default)', boxShadow: 'inset 0 0 18px rgba(139,92,246,0.2)' }}>
            <VxIcon name="target" size={24} />
          </span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>Reel Intel</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--font-display)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Content Intelligence Agent</div>
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, background: 'rgba(46,230,160,0.10)', border: '1px solid rgba(46,230,160,0.26)', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--signal-400)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--signal-400)', boxShadow: '0 0 8px var(--signal-400)' }} />
          Nova Active
        </span>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        <div className="vx-glass" style={cmdCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-6)' }}>
            <span style={{ color: 'var(--cyan-300)', display: 'flex' }}>
              <VxIcon name="sparkle" size={18} />
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--cyan-300)', textTransform: 'uppercase' }}>Analyze Instagram Reel</span>
          </div>
          <div className="vx-eyebrow" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Reel URL *</div>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.instagram.com/reel/…" style={inputStyle} />
          <div className="vx-eyebrow" style={{ color: 'var(--text-muted)', margin: 'var(--space-5) 0 8px' }}>Context Note (optional)</div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Guy explains how to close $5k deals using loom videos instead of proposals" style={textareaStyle} />
          <div
            onClick={analyze}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 'var(--space-5)', padding: '15px 0', borderRadius: 'var(--radius-md)', background: 'var(--grad-brand)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: 'var(--glow-violet)', opacity: analyzing ? 0.7 : 1 }}
          >
            <span style={{ display: 'flex' }}>
              <VxIcon name="send" size={14} color="#fff" />
            </span>
            {analyzing ? 'Analyzing…' : 'Analyze Reel'}
          </div>
        </div>

        <div className="vx-glass" style={cmdCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-5)' }}>
            <span style={{ color: 'var(--text-dim)', display: 'flex' }}>
              <VxIcon name="refresh" size={16} />
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-body)', textTransform: 'uppercase' }}>Intel History</span>
          </div>
          {HISTORY.map((h, i) => (
            <div key={i} style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--ink-700)', border: '1px solid var(--hairline)', marginBottom: 'var(--space-3)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-strong)', lineHeight: 'var(--lh-normal)' }}>{h.text}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-dim)' }}>{h.time}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--violet-300)' }}>{h.tags}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
