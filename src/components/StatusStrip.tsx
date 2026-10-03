'use client';

import React from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ds';
import { useWorkspaceStatus } from '@/lib/status/useWorkspaceStatus';

interface Tile { key: string; label: string; value: React.ReactNode; note: string; href: string; tone?: 'bad' | 'warn' }

/** Live operational status: approvals waiting, drafts, running tasks, proven sends, failures. Real counts only. */
export default function StatusStrip() {
  const { status, error, loading } = useWorkspaceStatus();

  if (!status) {
    return (
      <div className="vx-grid vx-grid--stats" role="status" aria-label={loading ? 'Loading live status' : 'Live status unavailable'}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="vx-stat" style={{ minHeight: 96 }}><Skeleton width="50%" height={12} /><Skeleton width="35%" height={30} /><Skeleton width="70%" height={12} /></div>)
          : <div className="vx-callout" data-tone="bad" style={{ gridColumn: '1 / -1' }}><div><p className="vx-callout__title">Live status unavailable</p><p className="vx-callout__body">{error}</p></div></div>}
      </div>
    );
  }
  const waiting = status.approvalsPending + status.tasks.needsApproval;
  const tiles: Tile[] = [
    { key: 'approvals', label: 'Awaiting approval', value: waiting, note: waiting ? 'Review before agents continue' : 'Nothing waiting', href: '/command-center', tone: waiting ? 'warn' : undefined },
    { key: 'drafts', label: 'Drafts to review', value: status.outreach.drafts, note: status.outreach.approved ? `${status.outreach.approved} approved, sending` : 'Outreach not yet approved', href: '/outreach' },
    { key: 'running', label: 'Tasks running', value: status.tasks.running, note: `${status.tasks.queued} queued - ${status.tasks.done} done`, href: '/tasks' },
    { key: 'sent', label: 'Sent today', value: <>{status.email.sentToday}<small> / {status.email.cap || 0}</small></>, note: status.email.ready ? `via ${status.email.provider}` : 'Email not ready - nothing can send', href: '/settings', tone: status.email.ready ? undefined : 'warn' },
    { key: 'failed', label: 'Failed sends', value: status.outreach.failed, note: status.outreach.failed ? 'Open Outreach to retry' : 'No failures', href: '/outreach', tone: status.outreach.failed ? 'bad' : undefined },
  ];
  return (
    <section aria-label="Live status">
      <div className="vx-grid vx-grid--stats">
        {tiles.map(t => (
          <Link key={t.key} href={t.href} className="vx-stat" data-tone={t.tone}>
            <span className="vx-stat__label">{t.label}</span>
            <span className="vx-stat__value">{t.value}</span>
            <span className="vx-stat__note">{t.note}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
