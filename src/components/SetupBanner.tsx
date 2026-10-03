'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { VxIcon } from '@/components/ds';
import { useWorkspaceStatus } from '@/lib/status/useWorkspaceStatus';

const KEY = 'postelos-setup-dismissed';

/**
 * Compact reminder on every page except the dashboard (which shows the full checklist) while
 * the workspace is not fully configured. Driven by the real /api/workspace/status.
 * Renders nothing while loading, on error, or when setup is complete.
 */
export default function SetupBanner() {
  const pathname = usePathname();
  const { status } = useWorkspaceStatus();
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDismissed(sessionStorage.getItem(KEY) === '1'), 0);
    return () => clearTimeout(t);
  }, []);

  if (dismissed || !status || status.onboarding.complete || pathname === '/' || pathname === '/settings') return null;
  const { steps, done, total } = status.onboarding;
  const next = steps.find(s => !s.done);

  return (
    <div className="vx-callout" data-tone="warn" role="region" aria-label="Setup reminder" style={{ marginBottom: 'var(--space-4)' }}>
      <VxIcon name="alert" size={18} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="vx-callout__title">Setup incomplete - {done} of {total} steps done</p>
        {next ? <p className="vx-callout__body">Next: {next.title}. {next.detail}</p> : null}
      </div>
      {next ? <Link href={next.href} className="vx-linkbtn">Fix it</Link> : null}
      <button type="button" className="vx-iconaction" aria-label="Dismiss setup reminder" onClick={() => { setDismissed(true); sessionStorage.setItem(KEY, '1'); }}>
        <VxIcon name="close" size={16} />
      </button>
    </div>
  );
}
