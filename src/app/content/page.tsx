'use client';

import React from 'react';
import { PageHeaderCard, VxIcon } from '@/components/ds';

/**
 * Content — ported from the "isContent" view of the design prototype:
 * header with DRAFTS / POSTED counts, a grid of platform draft cards with
 * viral hooks, and the "Create Social Posts with AI" composer.
 */

const DRAFTS = [
  { platform: 'LinkedIn', status: 'Approved', title: 'The AI Receptionist Math for Local Businesses', hook: '"If your business has a front desk, you are losing at least 15 hours a week to phone calls that could be automated."', created: 'Created 6/11/2026' },
  { platform: 'Instagram', status: 'Approved', title: 'Before & After: Dental Website Booking Flow Redesign', hook: '"Stop forcing patient prospects to dial a phone number in 2026."', created: 'Created 6/11/2026' },
  { platform: 'YouTube', status: 'Approved', title: 'How I Built an AI Booking Agent in 2 Hours', hook: '"Watch me build an autonomous AI receptionist from scratch for a local salon."', created: 'Created 6/10/2026' },
];

export default function ContentPage() {
  const [topic, setTopic] = React.useState('');
  const [writing, setWriting] = React.useState(false);
  const t = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const writePosts = () => {
    setWriting(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setWriting(false), 2200);
  };
  React.useEffect(() => () => clearTimeout(t.current), []);

  return (
    <>
      <PageHeaderCard
        icon="doc"
        title="Content"
        subtitle="Ryan drafts authority posts from your topics — approve, schedule, and post."
        stats={[
          { value: '3', label: 'DRAFTS', color: 'var(--cyan-300)' },
          { value: '0', label: 'POSTED', color: 'var(--signal-400)' },
        ]}
      />

      <section style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          {DRAFTS.map((d) => (
            <div
              key={d.title}
              className="vx-glass"
              style={{ display: 'flex', flexDirection: 'column', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--grad-panel)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-md), var(--sheen-top)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cyan-300)', padding: '4px 10px', borderRadius: 6, background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.24)' }}>{d.platform}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--signal-400)', padding: '3px 10px', borderRadius: 999, background: 'rgba(46,230,160,0.10)', border: '1px solid rgba(46,230,160,0.26)' }}>{d.status}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text-strong)', marginTop: 14, lineHeight: 'var(--lh-snug)' }}>{d.title}</div>
              <div style={{ marginTop: 14, padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'rgba(139,92,246,0.06)', border: '1px solid var(--hairline)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 9.5, fontWeight: 700, letterSpacing: 'var(--ls-wide)', color: 'var(--violet-300)', textTransform: 'uppercase', marginBottom: 6 }}>Viral Hook</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-body)', fontStyle: 'italic', lineHeight: 'var(--lh-normal)' }}>{d.hook}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 14 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-dim)' }}>{d.created}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: 'var(--signal-400)', cursor: 'pointer' }}>
                  <span style={{ display: 'flex' }}>
                    <VxIcon name="send" size={14} />
                  </span>
                  Mark Posted
                </span>
              </div>
            </div>
          ))}
        </div>

        <div
          className="vx-glass"
          style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(155deg, rgba(34,211,238,0.06), rgba(10,7,26,0.5))', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg), var(--sheen-top)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-5)' }}>
            <span style={{ color: 'var(--cyan-300)', display: 'flex' }}>
              <VxIcon name="sparkle" size={18} />
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--cyan-300)', textTransform: 'uppercase' }}>Create Social Posts with AI</span>
          </div>
          <div className="vx-eyebrow" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>What topic do you want to write about?</div>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="AI Receptionist ROI math for dental practices"
            style={{ width: '100%', minHeight: 92, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--ink-700)', border: '1px solid var(--border-default)', color: 'var(--text-strong)', fontFamily: 'var(--font-body)', fontSize: 13.5, outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
          />
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: 'var(--space-4) 0' }}>
            <span style={{ color: 'var(--warn-400)', display: 'flex', flex: '0 0 auto', marginTop: 1 }}>
              <VxIcon name="sparkle" size={14} />
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 'var(--lh-normal)' }}>The AI will write a complete post with hook lines and post text customized for your potential clients.</span>
          </div>
          <div
            onClick={writePosts}
            style={{ textAlign: 'center', padding: '13px 0', borderRadius: 'var(--radius-md)', background: 'var(--grad-brand)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: 'var(--glow-violet)', opacity: writing ? 0.7 : 1 }}
          >
            {writing ? 'Writing…' : 'Write Posts with AI'}
          </div>
        </div>
      </section>
    </>
  );
}
