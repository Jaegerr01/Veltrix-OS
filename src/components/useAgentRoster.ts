'use client';

import { asErr } from '@/lib/errors';
import React from 'react';
import { db } from '@/lib/db';
import { deriveAgentActivity, type AgentActivity } from '@/lib/agentActivity';

/** Live per-agent roster from the tasks table. Returns `error` instead of faking data when the DB is unreachable. */
export function useAgentRoster(pollMs = 15000) {
  const [agents, setAgents] = React.useState<AgentActivity[]>(() => deriveAgentActivity([]));
  const [error, setError] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    let live = true;
    const load = async () => {
      try { const t = await db.getTasks(); if (live) { setAgents(deriveAgentActivity(t)); setError(null); setLoaded(true); } }
      catch (raw) { const e = asErr(raw); if (live) setError(e?.message || 'Could not load agent activity.'); }
    };
    load();
    const id = setInterval(() => { if (!document.hidden) load(); }, pollMs);
    return () => { live = false; clearInterval(id); };
  }, [pollMs]);
  return { agents, error, loaded };
}
