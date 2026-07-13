'use client';

import React from 'react';
import { StatCard, AgentCard, VxIcon, AGENT_DEFS, ACTIVITY_DEFS } from '@/components/ds';

/**
 * Command Center — ported from the "isCommand" view of the design prototype:
 * Approval Queue, Goal Cascade + Lead Scraper controls, Live Data pipeline,
 * a KPI row, and the Agent Roster paired with Live Telemetry. The scraper
 * form is locally interactive (matches the prototype's simulated run).
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
const inputStyle: React.CSSProperties = { ...selectStyle, appearance: 'auto', cursor: 'text', padding: '0 14px' };

const NICHES = ['Dental clinic', 'Med spa', 'Law firm', 'Real estate agency', 'Fitness studio', 'Auto detailing'];

const KPIS = [
  { label: 'Pipeline Value', value: '1.24', unit: 'M USD', delta: '+18%', accent: 'violet' },
  { label: 'Meetings Booked', value: '86', unit: '', delta: '+12%', accent: 'blue' },
  { label: 'Emails Sent', value: '3,482', unit: '', delta: '+24%', accent: 'cyan' },
  { label: 'Avg Open Rate', value: '41', unit: '%', delta: '-3%', accent: 'magenta' },
] as const;

const LIVE_PIPELINE = [
  { label: 'New', value: '863', color: 'var(--cyan-300)' },
  { label: 'Contacted', value: '0', color: 'var(--text-strong)' },
  { label: 'Replied', value: '62', color: 'var(--violet-300)' },
  { label: 'Booked', value: '0', color: 'var(--text-strong)' },
  { label: 'Proposal', value: '0', color: 'var(--text-strong)' },
  { label: 'Won', value: '0', color: 'var(--signal-400)' },
  { label: 'Lost', value: '0', color: 'var(--text-strong)' },
  { label: 'Nurture', value: '0', color: 'var(--text-strong)' },
];

function Checkbox({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <span
        style={{
          width: 20,
          height: 20,
          flex: '0 0 auto',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: on ? 'var(--grad-brand)' : 'transparent',
          border: on ? '1px solid transparent' : '1px solid var(--border-default)',
          boxShadow: on ? 'var(--glow-violet)' : 'none',
        }}
      >
        {on ? <VxIcon name="check" size={12} color="#fff" /> : null}
      </span>
      <span style={{ fontSize: 13.5, color: 'var(--text-body)' }}>{label}</span>
    </div>
  );
}

const telemetryDot = (tone: string) =>
  tone === 'active' ? 'var(--signal-400)' : tone === 'warn' ? 'var(--warn-400)' : tone === 'brand' ? 'var(--violet-300)' : 'var(--cyan-400)';

export default function CommandCenterPage() {
  const [niche, setNiche] = React.useState('Dental clinic');
  const [location, setLocation] = React.useState('');
  const [maxLeads, setMaxLeads] = React.useState('20');
  const [autoResearch, setAutoResearch] = React.useState(true);
  const [writeSheets, setWriteSheets] = React.useState(false);
  const [scraping, setScraping] = React.useState(false);
  const scrapeT = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const runScrape = () => {
    setScraping(true);
    clearTimeout(scrapeT.current);
    scrapeT.current = setTimeout(() => setScraping(false), 2200);
  };
  React.useEffect(() => () => clearTimeout(scrapeT.current), []);

  return (
    <>
      {/* Approval Queue */}
      <section className="vx-glass" style={cmdCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="vx-eyebrow" style={{ color: 'var(--text-dim)' }}>Entity · Propose-then-Approve</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <span style={{ color: 'var(--signal-400)', display: 'flex' }}>
                <VxIcon name="shield" size={22} />
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>Barry&apos;s Approval Queue</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--violet-200)', padding: '2px 9px', borderRadius: 999, background: 'rgba(139,92,246,0.14)', border: '1px solid var(--border-default)' }}>0</span>
            </div>
          </div>
          <span style={{ color: 'var(--text-dim)', cursor: 'pointer', display: 'flex' }}>
            <VxIcon name="refresh" size={18} />
          </span>
        </div>
        <div style={{ textAlign: 'center', padding: 'var(--space-8) 0 var(--space-4)', color: 'var(--text-muted)', fontSize: 14 }}>
          ✓ Queue clear — nothing awaiting your decision
        </div>
      </section>

      {/* Goal Cascade + Lead Scraper */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', alignItems: 'stretch' }}>
        <div className="vx-glass" style={cmdCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="vx-eyebrow" style={{ color: 'var(--text-dim)' }}>Entity · Goal Cascade</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <span style={{ color: 'var(--violet-300)', display: 'flex' }}>
                  <VxIcon name="target" size={22} />
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 19, fontWeight: 500, color: 'var(--text-strong)' }}>2026-07 · 2026-W28</span>
              </div>
            </div>
            <span style={{ color: 'var(--text-dim)', cursor: 'pointer', display: 'flex' }}>
              <VxIcon name="refresh" size={18} />
            </span>
          </div>
          <div style={{ marginTop: 'var(--space-5)', padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', background: 'var(--ink-700)', border: '1px solid var(--hairline)', fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 'var(--lh-relaxed)' }}>
            No ratified cascade for this month yet. Draft one — it lands in your Approval Queue for one-click ratification.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 'var(--space-4)', padding: '13px 0', borderRadius: 'var(--radius-md)', background: 'rgba(139,92,246,0.14)', border: '1px solid var(--border-default)', color: 'var(--violet-200)', fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
            <span style={{ display: 'flex' }}>
              <VxIcon name="branch" size={17} />
            </span>
            Draft this month&apos;s cascade → Approval Queue
          </div>
        </div>

        <div className="vx-glass" style={cmdCard}>
          <div className="vx-eyebrow" style={{ color: 'var(--text-dim)' }}>Victor · Lead Scout</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 'var(--space-6)' }}>
            <span style={{ color: 'var(--cyan-300)', display: 'flex' }}>
              <VxIcon name="target" size={22} />
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: 'var(--text-strong)' }}>Lead Scraper Control</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div>
              <div className="vx-eyebrow" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Niche</div>
              <select value={niche} onChange={(e) => setNiche(e.target.value)} style={selectStyle}>
                {NICHES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="vx-eyebrow" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Location</div>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Austin, TX" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <div className="vx-eyebrow" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Max Leads</div>
            <input value={maxLeads} onChange={(e) => setMaxLeads(e.target.value)} type="number" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'var(--space-5)' }}>
            <Checkbox on={autoResearch} onToggle={() => setAutoResearch((v) => !v)} label="Auto-research (Daniel)" />
            <Checkbox on={writeSheets} onToggle={() => setWriteSheets((v) => !v)} label="Write to Google Sheets" />
          </div>
          <div
            onClick={runScrape}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '15px 0',
              borderRadius: 'var(--radius-md)',
              background: 'var(--grad-brand)',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: 'var(--glow-violet)',
              opacity: scraping ? 0.7 : 1,
            }}
          >
            <span style={{ display: 'flex' }}>
              <VxIcon name="play" size={16} color="#fff" />
            </span>
            {scraping ? 'Scraping…' : 'Run Scrape'}
          </div>
          <div style={{ marginTop: 'var(--space-4)', fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 'var(--lh-relaxed)' }}>
            Local dev only · results import as &quot;New&quot; leads · dedup on · outreach still requires your approval
          </div>
        </div>
      </section>

      {/* Live Data */}
      <section className="vx-glass" style={cmdCard}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
          <div>
            <div className="vx-eyebrow" style={{ color: 'var(--cyan-300)' }}>Live Data</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', marginTop: 4 }}>Lead Pipeline</div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>Today: 0 tasks · 0 follow-ups</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 'var(--space-3)' }}>
          {LIVE_PIPELINE.map((lp) => (
            <div key={lp.label} style={{ padding: 'var(--space-4) var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--ink-700)', border: '1px solid var(--hairline)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: lp.color, lineHeight: 1 }}>{lp.value}</div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 8 }}>{lp.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* KPI row */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-5)' }}>
        {KPIS.map((k, i) => (
          <StatCard
            key={k.label}
            label={k.label}
            value={k.value}
            unit={k.unit}
            delta={k.delta}
            accent={k.accent}
            style={{ animation: 'vxFadeUp 0.6s var(--ease-out) both', animationDelay: `${i * 0.06}s` }}
          />
        ))}
      </section>

      {/* Agent Roster + Live Telemetry */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 'var(--space-6)', alignItems: 'stretch' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
            <div>
              <div className="vx-eyebrow" style={{ color: 'var(--violet-300)', marginBottom: 6 }}>Workforce</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-strong)' }}>Agent Roster</div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>8 AGENTS · 5 ACTIVE</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }}>
            {AGENT_DEFS.map((a, i) => (
              <AgentCard key={a.id} agent={a} index={i} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 'var(--space-4)' }}>Live Telemetry</div>
          <div className="vx-glass" style={{ ...cmdCard, padding: 0, overflow: 'hidden' }}>
            {ACTIVITY_DEFS.map((row, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '54px 1fr',
                  columnGap: 12,
                  rowGap: 2,
                  alignItems: 'baseline',
                  padding: '13px 20px',
                  borderBottom: i < ACTIVITY_DEFS.length - 1 ? '1px solid var(--hairline)' : 'none',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{row.time}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-body)', lineHeight: 1.5 }}>{row.text}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-5)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="vx-glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--grad-panel)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-md), var(--sheen-top)' }}>
              <div className="vx-eyebrow" style={{ color: 'var(--text-muted)' }}>System Load</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 500, color: 'var(--signal-400)', marginTop: 8, lineHeight: 1 }}>
                32<span style={{ fontSize: 14, color: 'var(--text-dim)' }}>%</span>
              </div>
              <div style={{ height: 4, borderRadius: 999, background: 'var(--ink-500)', marginTop: 12, overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: '32%', background: 'var(--grad-brand)', boxShadow: 'var(--glow-violet)' }} />
              </div>
            </div>
            <div className="vx-glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--grad-panel)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-md), var(--sheen-top)' }}>
              <div className="vx-eyebrow" style={{ color: 'var(--text-muted)' }}>Uptime</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 500, color: 'var(--cyan-300)', marginTop: 8, lineHeight: 1 }}>
                99.98<span style={{ fontSize: 14, color: 'var(--text-dim)' }}>%</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 14, fontFamily: 'var(--font-mono)' }}>14d 06h · no incidents</div>
            </div>
          </div>

          <div
            className="vx-glass"
            style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-5)',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.14), rgba(34,211,238,0.06))',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-md), var(--sheen-top)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
            }}
          >
            <span style={{ width: 42, height: 42, flex: '0 0 auto', borderRadius: 'var(--radius-md)', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: 'var(--glow-violet)' }}>
              <VxIcon name="mic" size={22} color="#fff" />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>Talk to your CEO Agent</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Voice command the workforce</div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--cyan-300)' }}>▸ Listening…</span>
          </div>
        </div>
      </section>
    </>
  );
}
