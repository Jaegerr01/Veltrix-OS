'use client';

import React from 'react';
import { PageHeaderCard, VxIcon } from '@/components/ds';

/**
 * Tasks — ported from the "isTasks" view of the design prototype: a
 * command-card header with OPEN / COMPLETED readouts and a four-column
 * kanban (To-Do, Working On, Needs Review, Completed).
 */

const PR_COLOR: Record<string, string> = { High: 'var(--danger-400)', Medium: 'var(--warn-400)', Low: 'var(--mist-400)' };

interface TaskCard {
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  title: string;
  desc: string;
  date: string;
  agent: string;
}

const COMPLETED: TaskCard[] = [
  { priority: 'High', category: 'Outreach', title: 'Draft & send personalized initial outreach', desc: 'Recommended in Daily Report: reach the top 5 dental leads with tailored openers.', date: '2026-07-01', agent: 'Outreach AI' },
  { priority: 'High', category: 'Lead Research', title: 'Book appointment — Dental Clinic, Austin TX', desc: 'Qualified prospect from the scraper run. Schedule a discovery call.', date: '2026-07-01', agent: 'Appt Setter' },
  { priority: 'Medium', category: 'Lead Research', title: 'Autonomous research — Dental Center of Nevada', desc: 'Auto-researched and qualified. Score 8.6/10 · status set to Qualified.', date: '2026-06-30', agent: 'Lead Gen AI' },
];

const COLUMNS: { name: string; tone: string; tasks: TaskCard[] }[] = [
  { name: 'To-Do', tone: 'var(--cyan-400)', tasks: [] },
  { name: 'Working On', tone: 'var(--violet-300)', tasks: [] },
  { name: 'Needs Review', tone: 'var(--warn-400)', tasks: [] },
  { name: 'Completed', tone: 'var(--signal-400)', tasks: COMPLETED },
];

export default function TasksPage() {
  return (
    <>
      <PageHeaderCard
        icon="usercheck"
        title="Tasks"
        subtitle="Everything the agents and you have committed to — approve, complete, or clear."
        stats={[
          { value: '0', label: 'OPEN', color: 'var(--warn-400)' },
          { value: '1000', label: 'COMPLETED', color: 'var(--signal-400)' },
        ]}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', height: 40, borderRadius: 'var(--radius-md)', background: 'var(--grad-brand)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--glow-violet)', whiteSpace: 'nowrap' }}>
            <span style={{ display: 'flex' }}>
              <VxIcon name="plus" size={16} color="#fff" />
            </span>
            New Task
          </div>
        }
      />

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--space-5)', alignItems: 'start' }}>
        {COLUMNS.map((col) => (
          <div
            key={col.name}
            className="vx-glass"
            style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--grad-panel)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-md), var(--sheen-top)', minHeight: 320 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--hairline)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.tone, boxShadow: `0 0 8px ${col.tone}` }} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: 'var(--ls-wide)', textTransform: 'uppercase', color: 'var(--text-body)' }}>{col.name}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', padding: '2px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--hairline)' }}>{col.tasks.length}</span>
            </div>
            {col.tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--text-dim)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>No tasks in this list</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {col.tasks.map((tk) => (
                  <div key={tk.title} style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--ink-700)', border: '1px solid var(--hairline)', cursor: 'grab' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: PR_COLOR[tk.priority], padding: '3px 8px', borderRadius: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--hairline)' }}>{tk.priority}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{tk.category}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)', lineHeight: 'var(--lh-snug)' }}>{tk.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6, lineHeight: 'var(--lh-normal)' }}>{tk.desc}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--hairline)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-dim)' }}>{tk.date}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--cyan-300)' }}>{tk.agent}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
