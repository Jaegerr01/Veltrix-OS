'use client';

// Entity Phase 1 — Barry's Approval Queue.
// Every autonomous external action lands here as a decision-ready card:
// context, exact payload, agent confidence. Approve / Edit & Approve / Reject.
// Doctrine: PostelOS Constitution (Memory Vault note "Constitution") (Article 3).

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Check, X, Pencil, RefreshCw, ChevronDown, ChevronUp, Send, Copy, ExternalLink } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { useToast } from '@/components/Toast';
import type { ApprovalRequest } from '@/lib/types';
import { asErr } from '@/lib/errors';

const DEPT_COLORS: Record<string, string> = {
  revenue: 'text-neon-purple bg-neon-purple/10 border-neon-purple/20',
  growth: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20',
  governance: 'text-neon-green bg-neon-green/10 border-neon-green/20',
};
const deptChip = (d: string) => DEPT_COLORS[d] ?? 'text-white/50 bg-white/[0.05] border-white/[0.1]';

export default function ApprovalQueue() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // pending = waiting for a decision; failed = approved but the action did NOT happen (retryable)
      const [p, f] = await Promise.all([
        authFetch('/api/entity/approvals?status=pending').then(r => r.json()),
        authFetch('/api/entity/approvals?status=failed').then(r => r.json()),
      ]);
      if (p.success || f.success) setRequests([...(f.requests || []), ...(p.requests || [])]);
      else setLoadError(p.error || f.error || 'Could not load the approval queue.');
      if (p.success || f.success) setLoadError(null);
    } catch (eRaw: unknown) { const e = asErr(eRaw);
      setLoadError(`Could not load the approval queue: ${e?.message || 'network error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, [load]);

  const decide = async (
    req: ApprovalRequest,
    decision: 'approve' | 'reject',
    editedPayload?: Record<string, unknown>
  ) => {
    setBusyId(req.id);
    try {
      const res = await authFetch(`/api/entity/approvals/${req.id}`, {
        method: 'POST',
        body: JSON.stringify({ decision, editedPayload }),
      });
      const data = await res.json();
      if (data.executed === false) {
        // Approved, but the action did NOT happen. Say so plainly and keep the card for retry.
        toast.error('Approved - but NOT sent', data.error || data.executionNote || 'The action did not complete.');
        await load();
      } else if (data.success) {
        if (decision === 'approve') {
          toast.success('Done', data.executionNote || 'Action executed.');
        } else {
          toast.info('Rejected', 'The entity will learn from this.');
        }
        setRequests(prev => prev.filter(r => r.id !== req.id));
        setEditingId(null);
        setExpandedId(null);
      } else {
        toast.error('Decision failed', data.error);
      }
    } catch (eRaw: unknown) { const e = asErr(eRaw);
      toast.error('Decision failed', e?.message);
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (req: ApprovalRequest) => {
    setEditingId(req.id);
    setExpandedId(req.id);
    setEditedText(String((req.payload as { text?: unknown } | undefined)?.text ?? ''));
  };

  return (
    <div className="rounded-2xl bg-[rgba(13,13,22,0.55)] backdrop-blur-xl border border-white/[0.07] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.18em]">Entity · Propose-then-Approve</p>
          <h2 className="text-[15px] font-bold text-white mt-1 flex items-center gap-2">
            <ShieldCheck size={15} className="text-neon-purple" />
            Barry&apos;s Approval Queue
            <span className="text-[11px] font-mono font-normal text-neon-purple bg-neon-purple/10 px-1.5 py-0.5 rounded-full border border-neon-purple/20">
              {requests.length}
            </span>
          </h2>
        </div>
        <button
          onClick={load}
          className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-neon-cyan transition-colors cursor-pointer"
          title="Refresh queue"
          aria-label="Refresh approval queue"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/5 p-2.5 text-[11px] font-mono text-red-300">{loadError}</div>
      )}

      {requests.length === 0 && loading && !loadError && (
        <div role="status" className="py-8 text-center text-[11px] font-mono text-white/25">Loading approvals...</div>
      )}

      {requests.length === 0 && !loading && !loadError && (
        <div className="py-8 text-center text-[11px] font-mono text-white/25">
          ✓ Queue clear — nothing awaiting your decision
        </div>
      )}

      <AnimatePresence>
        {requests.map(req => {
          const payload = (req.payload ?? {}) as Record<string, string | undefined>;
          const expanded = expandedId === req.id;
          const editing = editingId === req.id;
          const busy = busyId === req.id;
          const isSocialDM = !!payload.channel && payload.channel !== 'Email';
          return (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="rounded-xl bg-[rgba(10,10,18,0.6)] border border-white/[0.07] p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${deptChip(req.department)}`}>
                      {req.department}
                    </span>
                    <span className="text-[9px] font-mono text-white/30">{req.created_by_agent}</span>
                    {payload.channel && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${isSocialDM ? 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20' : 'text-white/40 bg-white/[0.05] border-white/[0.1]'}`}>
                        {payload.channel}{isSocialDM ? ' · assisted' : ''}
                      </span>
                    )}
                    {typeof req.confidence === 'number' && (
                      <span className="text-[9px] font-mono text-white/30">confidence {req.confidence}/10</span>
                    )}
                  </div>
                  <h3 className="text-[13px] font-semibold text-white mt-1.5 leading-snug">{req.title}</h3>
                  {req.status === 'failed' && (
                    <p className="text-[11px] mt-1 font-mono text-red-300 break-words">
                      Approved earlier, but NOT sent: {req.execution_result || 'the action failed'}. Fix the cause (see Settings → Email), then retry.
                    </p>
                  )}
                  {req.recommendation && (
                    <p className="text-[11px] text-neon-cyan/70 mt-0.5 font-sans">↳ {req.recommendation}</p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={expanded ? `Hide details for ${req.title}` : `Show details for ${req.title}`}
                  aria-expanded={expanded}
                  onClick={() => setExpandedId(expanded ? null : req.id)}
                  className="vx-tap p-1 rounded-lg hover:bg-white/5 text-white/25 hover:text-white/60 transition-colors cursor-pointer shrink-0"
                >
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {expanded && (
                <div className="flex flex-col gap-2 text-[11px] font-sans">
                  {req.context && (
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-2.5 text-white/45 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {req.context}
                    </div>
                  )}
                  {payload.to && (
                    <div className="text-white/40 font-mono text-[10px]">
                      To: <span className="text-white/70">{payload.to}</span>
                      {payload.subject && <> · Subject: <span className="text-white/70">{payload.subject}</span></>}
                    </div>
                  )}
                  {editing ? (
                    <textarea
                      value={editedText}
                      onChange={e => setEditedText(e.target.value)}
                      rows={8}
                      className="w-full rounded-lg bg-black/40 border border-neon-purple/30 p-2.5 text-[12px] text-white/85 font-sans focus:outline-none focus:border-neon-purple/60 resize-y"
                    />
                  ) : payload.text ? (
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-2.5 text-white/60 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {payload.text}
                    </div>
                  ) : (
                    <pre className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-2.5 text-white/50 text-[10px] overflow-x-auto">
                      {JSON.stringify(req.payload, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {isSocialDM && (
                  <>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(editing ? editedText : String(payload.text ?? ''));
                        toast.info('Copied', `${payload.channel} message on clipboard — paste it in the DM.`);
                      }}
                      className="flex items-center gap-1.5 text-[11px] font-mono text-white/60 bg-white/[0.05] border border-white/[0.12] px-3 py-1.5 rounded-lg hover:bg-white/[0.1] transition-colors cursor-pointer"
                    >
                      <Copy size={11} /> Copy message
                    </button>
                    {payload.profileUrl && (
                      <a
                        href={payload.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] font-mono text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/25 px-3 py-1.5 rounded-lg hover:bg-neon-cyan/20 transition-colors cursor-pointer"
                      >
                        <ExternalLink size={11} /> Open profile
                      </a>
                    )}
                  </>
                )}
                {editing ? (
                  <button
                    disabled={busy}
                    onClick={() => decide(req, 'approve', { ...payload, text: editedText })}
                    className="flex items-center gap-1.5 text-[11px] font-mono text-neon-green bg-neon-green/10 border border-neon-green/25 px-3 py-1.5 rounded-lg hover:bg-neon-green/20 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Send size={11} /> {busy ? 'Executing…' : isSocialDM ? 'I sent it (edited)' : 'Approve edited'}
                  </button>
                ) : (
                  <button
                    disabled={busy}
                    onClick={() => decide(req, 'approve')}
                    className="flex items-center gap-1.5 text-[11px] font-mono text-neon-green bg-neon-green/10 border border-neon-green/25 px-3 py-1.5 rounded-lg hover:bg-neon-green/20 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Check size={11} /> {busy ? 'Executing…' : isSocialDM ? 'I sent it — mark Sent' : req.status === 'failed' ? 'Retry send' : req.type.endsWith('_send') ? 'Approve & send' : 'Approve'}
                  </button>
                )}
                {!editing && payload.text !== undefined && (
                  <button
                    disabled={busy}
                    onClick={() => startEdit(req)}
                    className="flex items-center gap-1.5 text-[11px] font-mono text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/25 px-3 py-1.5 rounded-lg hover:bg-neon-cyan/20 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                )}
                {editing && (
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-[11px] font-mono text-white/40 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel edit
                  </button>
                )}
                <button
                  disabled={busy}
                  onClick={() => decide(req, 'reject')}
                  className="flex items-center gap-1.5 text-[11px] font-mono text-white/40 border border-white/[0.1] px-3 py-1.5 rounded-lg hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/5 transition-colors cursor-pointer disabled:opacity-40 ml-auto"
                >
                  <X size={11} /> Reject
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
