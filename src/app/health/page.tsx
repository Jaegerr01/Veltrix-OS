'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Database,
  BrainCircuit,
  Mail,
  KeyRound,
  Activity,
} from 'lucide-react';

type Check = { ok: boolean; detail: string };
type Health = {
  service: string;
  ready: boolean;
  summary: string;
  env: Record<string, boolean>;
  checks: Record<string, Check>;
  checkedAt: string;
};

const CHECK_META: Record<string, { label: string; icon: React.ElementType }> = {
  supabase: { label: 'Database (Supabase)', icon: Database },
  supabaseAdmin: { label: 'Server Writes (Service Role)', icon: ShieldCheck },
  gemini: { label: 'Agent Brains (Gemini)', icon: BrainCircuit },
  resend: { label: 'Email Delivery (Resend)', icon: Mail },
};

export default function HealthPage() {
  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [deep, setDeep] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (withDeep: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/health${withDeep ? '?deep=1' : ''}`, { cache: 'no-store' });
      setData(await res.json());
    } catch (e: any) {
      setError(e?.message || 'Failed to reach /api/health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(deep);
  }, [load, deep]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="text-neon-purple" size={26} />
            System Status
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live diagnostics for every integration powering the autonomous pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={deep}
              onChange={(e) => setDeep(e.target.checked)}
              className="accent-[#a855f7]"
            />
            Deep check (live Gemini call)
          </label>
          <button
            onClick={() => load(deep)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyber-card border border-cyber-border hover:border-neon-purple/50 transition text-sm disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-neon-pink/40 bg-neon-pink/5 p-5 text-sm text-neon-pink">
          Could not load diagnostics: {error}
        </div>
      )}

      {data && (
        <>
          {/* Overall banner */}
          <div
            className={`rounded-2xl border p-6 flex items-start gap-4 ${
              data.ready
                ? 'border-neon-green/40 bg-neon-green/5'
                : 'border-neon-orange/40 bg-neon-orange/5'
            }`}
          >
            {data.ready ? (
              <CheckCircle2 className="text-neon-green shrink-0" size={28} />
            ) : (
              <XCircle className="text-neon-orange shrink-0" size={28} />
            )}
            <div>
              <h2 className="font-semibold text-lg">
                {data.ready ? 'All systems operational' : 'Setup incomplete'}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">{data.summary}</p>
            </div>
          </div>

          {/* Integration checks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(data.checks).map(([key, check]) => {
              const meta = CHECK_META[key] || { label: key, icon: Activity };
              const Icon = meta.icon;
              return (
                <div
                  key={key}
                  className={`rounded-2xl border p-5 bg-cyber-card/60 backdrop-blur ${
                    check.ok ? 'border-neon-green/20' : 'border-neon-pink/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <Icon size={18} className={check.ok ? 'text-neon-green' : 'text-neon-pink'} />
                      <span className="font-medium text-sm">{meta.label}</span>
                    </div>
                    {check.ok ? (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-neon-green/10 text-neon-green">
                        LIVE
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-neon-pink/10 text-neon-pink">
                        DOWN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{check.detail}</p>
                </div>
              );
            })}
          </div>

          {/* Environment variables */}
          <div className="rounded-2xl border border-cyber-border bg-cyber-card/60 backdrop-blur p-5">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound size={16} className="text-neon-cyan" />
              <h3 className="font-medium text-sm">Environment Variables</h3>
              <span className="text-xs text-muted-foreground">
                ({Object.values(data.env).filter(Boolean).length}/{Object.keys(data.env).length} set)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(data.env).map(([name, present]) => (
                <div
                  key={name}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/20 font-mono text-xs"
                >
                  <span className="text-muted-foreground truncate">{name}</span>
                  {present ? (
                    <span className="flex items-center gap-1 text-neon-green shrink-0">
                      <CheckCircle2 size={13} /> set
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-neon-pink shrink-0">
                      <XCircle size={13} /> missing
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-4">
              Set missing keys in <span className="font-mono">Netlify → Site configuration → Environment variables</span>, then redeploy. Secret values are never displayed here.
            </p>
          </div>

          <p className="text-[11px] text-muted-foreground text-right">
            Last checked {new Date(data.checkedAt).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}
