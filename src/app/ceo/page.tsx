'use client';

import { PageHeaderCard } from '@/components/ds';
import CeoConsole from '@/components/CeoConsole';

export default function CeoPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <PageHeaderCard
        icon="crown"
        title="CEO Console"
        subtitle="Tell the CEO agent what you want. It breaks the job into tasks, assigns each to the right specialist, runs them, and reports exactly what happened. Emails and proposals only ever wait for your approval."
      />
      <CeoConsole />
    </div>
  );
}
