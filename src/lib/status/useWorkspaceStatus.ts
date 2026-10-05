'use client';

import React from 'react';
import { authFetch } from '../authFetch';
import type { WorkspaceStatus } from './workspace';

type State = { status: WorkspaceStatus | null; error: string | null; loading: boolean };

/** One shared poller for all consumers (sidebar, top bar, dashboard, onboarding, settings). */
let state: State = { status: null, error: null, loading: true };
const subs = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let inflight: Promise<void> | null = null;

const emit = () => subs.forEach(f => f());

export async function refreshWorkspaceStatus(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await authFetch('/api/workspace/status', { cache: 'no-store' });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.success) state = { status: body.status, error: null, loading: false };
      else state = { ...state, error: body?.error || `Status unavailable (HTTP ${res.status}).`, loading: false };
    } catch {
      state = { ...state, error: 'Could not reach the server.', loading: false };
    } finally { inflight = null; emit(); }
  })();
  return inflight;
}

const subscribe = (cb: () => void) => {
  subs.add(cb);
  if (subs.size === 1) {
    void refreshWorkspaceStatus();
    timer = setInterval(() => { if (!document.hidden) void refreshWorkspaceStatus(); }, 30_000);
  }
  return () => { subs.delete(cb); if (!subs.size && timer) { clearInterval(timer); timer = null; } };
};

const SERVER: State = { status: null, error: null, loading: true };

export function useWorkspaceStatus(): State & { refresh: () => Promise<void> } {
  const s = React.useSyncExternalStore(subscribe, () => state, () => SERVER);
  return { ...s, refresh: refreshWorkspaceStatus };
}
