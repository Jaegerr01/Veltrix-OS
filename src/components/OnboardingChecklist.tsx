'use client';

import React from 'react';
import Link from 'next/link';
import { Skeleton, VxIcon } from '@/components/ds';
import { useWorkspaceStatus } from '@/lib/status/useWorkspaceStatus';

/**
 * First-run checklist driven by REAL configuration and data (see /api/workspace/status).
 * `variant="health"` (Settings) always shows every step with the exact env var names that are missing;
 * the default variant (dashboard) hides itself once everything is done.
 */
export default function OnboardingChecklist({ variant = 'banner' }: { variant?: 'banner' | 'health' }) {
  const { status, error, loading, refresh } = useWorkspaceStatus();
  const [expanded, setExpanded] = React.useState(false);

  if (loading && !status) {
    return (
      <section className="vx-card vx-onb" data-variant={variant} role="status" aria-label="Checking setup status">
        <Skeleton width="40%" height={20} />
        <div style={{ height: 12 }} />
        <Skeleton height={44} /><div style={{ height: 8 }} /><Skeleton height={44} /><div style={{ height: 8 }} /><Skeleton height={44} />
      </section>
    );
  }
  if (!status) {
    return (
      <section className="vx-callout" data-tone="bad" role="alert">
        <VxIcon name="alert" size={18} />
        <div>
          <p className="vx-callout__title">Could not read setup status</p>
          <p className="vx-callout__body">{error || 'The server did not answer.'}</p>
          <button type="button" className="vx-linkbtn" style={{ marginTop: 8 }} onClick={() => { void refresh(); }}>Try again</button>
        </div>
      </section>
    );
  }
  const { steps, done, total, complete } = status.onboarding;
  const pct = Math.round((done / total) * 100);
  const next = steps.find(s => !s.done);

  const stepList = (
    <ol className="vx-steps">
        {steps.map((s, i) => (
          <li key={s.id} className="vx-step" data-done={s.done}>
            <span className="vx-step__mark" aria-hidden="true">{s.done ? <VxIcon name="check" size={13} color="#fff" /> : i + 1}</span>
            <div>
              <p className="vx-step__title">{s.title}<span className="vx-sr-only">{s.done ? ' (done)' : ' (to do)'}</span></p>
              <p className="vx-step__detail">{s.detail}</p>
              {!s.done && s.envVars?.length ? (
                <p style={{ margin: 0 }}>{s.envVars.map(v => <code key={v} className="vx-step__env">{v}</code>)}</p>
              ) : null}
            </div>
            {!s.done ? <Link href={s.href} className="vx-linkbtn vx-step__cta">{s.cta}</Link> : null}
          </li>
        ))}
    </ol>
  );

  if (variant === 'banner') {
    return (
      <section className="vx-card vx-onb" data-variant="banner" aria-labelledby="onboarding-title">
        <div className="vx-onb__bar">
          <div style={{ minWidth: 0 }}>
            <h2 className="vx-card__title" id="onboarding-title">{complete ? 'Setup complete' : `Setup: ${done} of ${total} steps done`}</h2>
            <p className="vx-stat__note" style={{ margin: 0 }}>
              {complete ? 'Database, AI, email, profile and first mission are all in place.' : next ? <>Next: <Link href={next.href} className="vx-linkbtn vx-tap">{next.title}</Link></> : null}
            </p>
          </div>
          <div className="vx-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Setup progress"><span style={{ width: `${pct}%` }} /></div>
          <button type="button" className="vx-linkbtn" aria-expanded={expanded} aria-controls="onboarding-steps" onClick={() => setExpanded(v => !v)}>{expanded ? 'Hide steps' : 'Show steps'}</button>
        </div>
        {expanded ? <div id="onboarding-steps">{stepList}</div> : null}
      </section>
    );
  }

  return (
    <section className="vx-card vx-onb" data-variant="health" aria-labelledby="onboarding-title">
      <div className="vx-card__head" style={{ marginBottom: 'var(--space-3)' }}>
        <div>
          <p className="vx-card__eyebrow">{variant === 'health' ? 'Workspace health' : 'First-run setup'}</p>
          <h2 className="vx-card__title" id="onboarding-title">
            {complete ? 'Everything is connected' : `${done} of ${total} steps done`}
          </h2>
        </div>
        {next ? <Link href={next.href} className="vx-linkbtn">Next: {next.title}</Link> : null}
      </div>
      <div className="vx-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Setup progress"><span style={{ width: `${pct}%` }} /></div>
      {stepList}
    </section>
  );
}
