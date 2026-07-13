'use client';

import React from 'react';
import { VxIcon, type VxIconName } from '@/components/ds';

/**
 * Memory — ported from the "isMemory" view of the design prototype: Obsidian
 * / Notion connector cards, a Recent Memory feed, and the Knowledge Sync dial
 * with sync stats. Connector toggles are locally interactive.
 */

const settingsCard: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
};

interface Conn {
  key: 'obsidian' | 'notion';
  name: string;
  desc: string;
  accent: string;
  icon: VxIconName;
  notes: string;
  glow: string;
}
const CONNECTORS: Conn[] = [
  { key: 'obsidian', name: 'Obsidian', desc: 'Sync your local vault of markdown notes', accent: 'var(--violet-300)', icon: 'gem', notes: '1,204', glow: 'radial-gradient(circle at 80% -20%, rgba(139,92,246,0.28), transparent 60%)' },
  { key: 'notion', name: 'Notion', desc: 'Connect workspace pages & databases', accent: 'var(--cyan-300)', icon: 'brain', notes: '1,214', glow: 'radial-gradient(circle at 80% -20%, rgba(34,211,238,0.26), transparent 60%)' },
];

const TAG_COLOR: Record<string, string> = { DEAL: 'var(--signal-400)', MEETING: 'var(--cyan-300)', IDEA: 'var(--warn-400)', PERSON: 'var(--violet-300)', NOTE: 'var(--mist-400)' };
const MEMORIES = [
  { tag: 'DEAL', title: 'Meridian Bank — pricing objection', snippet: 'Wants annual billing + SSO. Decision by EOQ.', time: '2h' },
  { tag: 'MEETING', title: 'Nordic Retail demo recap', snippet: 'Loved the automations page. Send security docs.', time: '5h' },
  { tag: 'IDEA', title: 'Q3 campaign angle', snippet: '"AI workforce that never sleeps" — test in ads.', time: '1d' },
  { tag: 'PERSON', title: 'Elena Voss — VP Ops @ Cobalt', snippet: 'Prefers async. Champions internal rollout.', time: '2d' },
  { tag: 'NOTE', title: 'Onboarding friction points', snippet: 'Users miss the CEO agent voice trigger.', time: '3d' },
];
const STATS = [
  { label: 'Last sync', value: '2 min ago' },
  { label: 'Auto-embed', value: 'On' },
  { label: 'Storage', value: '38.2 MB' },
];

export default function MemoryPage() {
  const [connectors, setConnectors] = React.useState({ obsidian: true, notion: false });
  const source = connectors.notion ? 'SOURCE · NOTION' : 'SOURCE · OBSIDIAN';

  return (
    <>
      {/* Connectors */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
        {CONNECTORS.map((c) => {
          const on = connectors[c.key];
          return (
            <div
              key={c.key}
              className="vx-glass"
              style={{
                position: 'relative',
                overflow: 'hidden',
                padding: 'var(--space-6)',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--grad-panel)',
                border: `1px solid ${on ? c.accent : 'var(--border-default)'}`,
                boxShadow: on ? `var(--shadow-lg), 0 0 30px ${c.accent}22` : 'var(--shadow-md), var(--sheen-top)',
                transition: 'all var(--dur-base) var(--ease-out)',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: c.glow, opacity: on ? 1 : 0.4, pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', position: 'relative', zIndex: 1 }}>
                <span style={{ width: 50, height: 50, flex: '0 0 auto', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(139,92,246,0.14)', border: '1px solid var(--border-default)', color: c.accent, boxShadow: 'inset 0 0 16px rgba(139,92,246,0.18)' }}>
                  <VxIcon name={c.icon} size={24} color={c.accent} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>{c.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{c.desc}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em', color: on ? 'var(--signal-400)' : 'var(--text-dim)', padding: '4px 10px', borderRadius: 999, background: on ? 'rgba(46,230,160,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? 'rgba(46,230,160,0.3)' : 'var(--hairline)'}` }}>
                  {on ? 'Connected' : 'Not linked'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-6)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--hairline)', position: 'relative', zIndex: 1 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: c.accent, lineHeight: 1 }}>{c.notes}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', marginTop: 4 }}>NOTES INDEXED</div>
                </div>
                <div
                  onClick={() => setConnectors((s) => ({ ...s, [c.key]: !s[c.key] }))}
                  style={{
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: '9px 18px',
                    borderRadius: 'var(--radius-md)',
                    color: on ? 'var(--text-muted)' : '#fff',
                    background: on ? 'transparent' : 'var(--grad-brand)',
                    border: on ? '1px solid var(--border-default)' : '1px solid transparent',
                    boxShadow: on ? 'none' : 'var(--glow-violet)',
                  }}
                >
                  {on ? 'Disconnect' : 'Connect'}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Recent memory + knowledge sync */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--space-6)', alignItems: 'stretch' }}>
        <div style={settingsCard}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>Recent Memory</div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-dim)' }}>{source}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {MEMORIES.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', padding: 'var(--space-4) 0', borderBottom: i < MEMORIES.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
                <span style={{ flex: '0 0 auto', fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.06em', color: TAG_COLOR[m.tag], padding: '4px 8px', borderRadius: 6, marginTop: 2, background: 'rgba(139,92,246,0.08)', border: '1px solid var(--hairline)' }}>{m.tag}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 'var(--lh-normal)' }}>{m.snippet}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{m.time}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={settingsCard}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 'var(--space-5)' }}>Knowledge Sync</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <div style={{ width: 168, height: 168, borderRadius: '50%', background: 'conic-gradient(var(--violet-400) 0% 78%, rgba(255,255,255,0.06) 78% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 36px rgba(139,92,246,0.3)' }}>
              <div style={{ width: 118, height: 118, borderRadius: '50%', background: 'var(--ink-800)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 26, color: 'var(--text-strong)', lineHeight: 1 }}>2,418</span>
                <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginTop: 3 }}>VECTORS</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {STATS.map((st) => (
              <div key={st.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{st.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-body)' }}>{st.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
