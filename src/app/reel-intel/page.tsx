'use client';

import React from 'react';
import { VxIcon, EmptyState } from '@/components/ds';
import { authFetch } from '@/lib/authFetch';
import { useToast } from '@/components/Toast';

/**
 * Reel Intel — ported from the "isReelIntel" view of the design prototype:
 * a titled header with a "Nova Active" badge, the Instagram reel analyzer
 * form, and the intel history column.
 *
 * Wired to Nova's real backend:
 *   POST /api/reel-intel          { url, context }  → analysis
 *   GET  /api/reel-intel/history                    → past analyses
 */

const cmdCard: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 14px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--ink-700)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-strong)',
  fontFamily: 'var(--font-body)',
  fontSize: 13.5,
  outline: 'none',
};
const textareaStyle: React.CSSProperties = { ...inputStyle, height: 'auto', minHeight: 92, padding: '12px 14px', resize: 'vertical', lineHeight: 1.5 };

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--violet-200)',
  marginBottom: 8,
};

interface ImplementationSuggestion {
  area: string;
  action: string;
  priority: string;
}
interface ReelIntelResult {
  summary: string;
  creator: string;
  topic: string;
  keyTakeaways: string[];
  postelosRelevance: string;
  implementationSuggestions: ImplementationSuggestion[];
  tags: string[];
}
interface HistoryNote {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  created_at: string;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const priorityColor = (p: string) =>
  /high|critical/i.test(p) ? 'var(--danger-400)' : /low/i.test(p) ? 'var(--text-dim)' : 'var(--warn-400)';

export default function ReelIntelPage() {
  const [url, setUrl] = React.useState('');
  const [note, setNote] = React.useState('');
  const [analyzing, setAnalyzing] = React.useState(false);
  const [result, setResult] = React.useState<ReelIntelResult | null>(null);
  const [savedToVault, setSavedToVault] = React.useState(false);
  const [history, setHistory] = React.useState<HistoryNote[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(true);
  const toast = useToast();

  // Refresh helper for event handlers (safe to call outside an effect).
  const loadHistory = React.useCallback(async () => {
    try {
      const res = await authFetch('/api/reel-intel/history');
      const data = await res.json();
      if (data.success) setHistory(Array.isArray(data.data) ? data.data : []);
    } catch {
      // Non-fatal — the analyzer still works without history.
    }
  }, []);

  // Initial load. Mirrors the async-IIFE pattern used in ScraperControl.tsx so
  // no setState happens synchronously in the effect body.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch('/api/reel-intel/history');
        const data = await res.json();
        if (!cancelled && data.success) setHistory(Array.isArray(data.data) ? data.data : []);
      } catch {
        // Non-fatal — the analyzer still works without history.
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const analyze = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.warning('Reel URL required', 'Paste an Instagram reel link first.');
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await authFetch('/api/reel-intel', {
        method: 'POST',
        body: JSON.stringify({ url: trimmed, context: note.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        setSavedToVault(!!data.savedToVault);
        toast.success('Nova: analysis complete', data.savedToVault ? 'Saved to your Memory Vault (Reel Intel folder).' : 'Saved to your notes.');
        setUrl('');
        setNote('');
        loadHistory();
      } else {
        toast.error('Analysis failed', data.error || 'Unknown error.');
      }
    } catch (e: unknown) {
      toast.error('Analysis failed', e instanceof Error ? e.message : 'Network error.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 52, height: 52, flex: '0 0 auto', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--violet-200)', background: 'rgba(139,92,246,0.14)', border: '1px solid var(--border-default)', boxShadow: 'inset 0 0 18px rgba(139,92,246,0.2)' }}>
            <VxIcon name="target" size={24} />
          </span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>Reel Intel</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--font-display)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Content Intelligence Agent</div>
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, background: 'rgba(46,230,160,0.10)', border: '1px solid rgba(46,230,160,0.26)', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--signal-400)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--signal-400)', boxShadow: '0 0 8px var(--signal-400)' }} />
          Nova Active
        </span>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="vx-glass" style={cmdCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-6)' }}>
              <span style={{ color: 'var(--cyan-300)', display: 'flex' }}>
                <VxIcon name="sparkle" size={18} />
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--cyan-300)', textTransform: 'uppercase' }}>Analyze Instagram Reel</span>
            </div>
            <div className="vx-eyebrow" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Reel URL *</div>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !analyzing) analyze(); }}
              placeholder="https://www.instagram.com/reel/…"
              style={inputStyle}
            />
            <div className="vx-eyebrow" style={{ color: 'var(--text-muted)', margin: 'var(--space-5) 0 8px' }}>Context Note (optional)</div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Guy explains how to close $5k deals using loom videos instead of proposals" style={textareaStyle} />
            <button
              onClick={analyze}
              disabled={analyzing}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 'var(--space-5)', padding: '15px 0', borderRadius: 'var(--radius-md)', background: 'var(--grad-brand)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', cursor: analyzing ? 'not-allowed' : 'pointer', boxShadow: 'var(--glow-violet)', opacity: analyzing ? 0.7 : 1, border: 'none' }}
            >
              <span style={{ display: 'flex' }}>
                <VxIcon name="send" size={14} color="#fff" />
              </span>
              {analyzing ? 'Analyzing…' : 'Analyze Reel'}
            </button>
          </div>

          {result && (
            <div className="vx-glass" style={cmdCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--signal-400)', display: 'flex' }}>
                    <VxIcon name="check" size={16} />
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-strong)', textTransform: 'uppercase' }}>{result.topic}</span>
                </div>
                {savedToVault && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--signal-400)' }}>saved to vault</span>
                )}
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 'var(--space-4)' }}>by {result.creator}</div>
              <div style={{ fontSize: 14, color: 'var(--text-strong)', lineHeight: 'var(--lh-normal)', marginBottom: 'var(--space-5)' }}>{result.summary}</div>

              {result.keyTakeaways.length > 0 && (
                <div style={{ marginBottom: 'var(--space-5)' }}>
                  <div style={sectionLabel}>Key Takeaways</div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {result.keyTakeaways.map((t, i) => (
                      <li key={i} style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 'var(--lh-normal)' }}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.postelosRelevance && (
                <div style={{ marginBottom: 'var(--space-5)' }}>
                  <div style={sectionLabel}>PostelOS Relevance</div>
                  <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 'var(--lh-normal)' }}>{result.postelosRelevance}</div>
                </div>
              )}

              {result.implementationSuggestions.length > 0 && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={sectionLabel}>Implementation</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.implementationSuggestions.map((s, i) => (
                      <div key={i} style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--ink-700)', border: '1px solid var(--hairline)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--cyan-300)' }}>{s.area}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: priorityColor(s.priority) }}>{s.priority}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 'var(--lh-normal)' }}>{s.action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.tags.length > 0 && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--violet-300)' }}>
                  {result.tags.map((t) => `#${t.replace(/\s+/g, '-')}`).join(' ')}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="vx-glass" style={cmdCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-5)' }}>
            <span style={{ color: 'var(--text-dim)', display: 'flex' }}>
              <VxIcon name="refresh" size={16} />
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-body)', textTransform: 'uppercase' }}>Intel History</span>
          </div>

          {historyLoading ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: 'var(--space-4) 0' }}>Loading…</div>
          ) : history.length === 0 ? (
            <EmptyState compact level={2} icon="play" title="No reels analyzed yet" body="Paste a reel URL above to start your intel library." />
          ) : (
            history.map((h) => (
              <div key={h.id} style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--ink-700)', border: '1px solid var(--hairline)', marginBottom: 'var(--space-3)' }}>
                <div style={{ fontSize: 13, color: 'var(--text-strong)', lineHeight: 'var(--lh-normal)' }}>{h.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-dim)' }}>{relativeTime(h.created_at)}</span>
                  {h.tags && h.tags.length > 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--violet-300)' }}>
                      {h.tags.slice(0, 3).map((t) => `#${t.replace(/\s+/g, '-')}`).join(' ')}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
