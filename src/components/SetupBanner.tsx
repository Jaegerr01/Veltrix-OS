'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';

/**
 * Shows a guided banner whenever a critical integration (Supabase / Gemini / Resend)
 * is not yet configured. Reads /api/health. Renders nothing when everything is live
 * or while loading. Dismissible for the session.
 */
export default function SetupBanner() {
  const [missing, setMissing] = useState<string[] | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('veltrix-setup-dismissed') === '1') {
      setDismissed(true);
    }
    fetch('/api/health', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d && !d.ready && d.checks) {
          const down = Object.entries(d.checks)
            .filter(([, c]: any) => !c.ok)
            .map(([k]) => k);
          setMissing(down);
        } else {
          setMissing([]);
        }
      })
      .catch(() => setMissing([]));
  }, []);

  if (dismissed || !missing || missing.length === 0) return null;

  const label: Record<string, string> = {
    supabase: 'Database',
    supabaseAdmin: 'Server writes',
    gemini: 'Agent brains',
    resend: 'Email delivery',
  };

  return (
    <div className="rounded-2xl border border-neon-orange/40 bg-neon-orange/[0.07] backdrop-blur-xl px-5 py-4 flex items-center gap-4">
      <AlertTriangle className="text-neon-orange shrink-0" size={20} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white/90">Setup incomplete — autonomy is paused</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Not yet configured:{' '}
          <span className="text-neon-orange font-medium">
            {missing.map((m) => label[m] || m).join(', ')}
          </span>
          . Add the missing keys to bring the pipeline online.
        </p>
      </div>
      <Link
        href="/health"
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neon-orange/15 hover:bg-neon-orange/25 border border-neon-orange/30 text-neon-orange text-xs font-medium transition shrink-0"
      >
        Fix it <ArrowRight size={13} />
      </Link>
      <button
        onClick={() => {
          setDismissed(true);
          sessionStorage.setItem('veltrix-setup-dismissed', '1');
        }}
        className="text-white/30 hover:text-white/70 transition shrink-0"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
