'use client';

// Entity Phase 1 — Barry's Approval Queue.
// Every autonomous external action lands here as a decision-ready card:
// context, exact payload, agent confidence. Approve / Edit & Approve / Reject.
// Doctrine: Obsidian → Entity/VELTRIX Constitution.md (Article 3).

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Check, X, Pencil, RefreshCw, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { useToast } from '@/components/Toast';
import type { ApprovalRequest } from '@/lib/types';

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
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/entity/approvals?status=pending');
      const data = await res.json();
      if (data.success) setRequests(data.requests || []);
    } catch {
      // silent — panel shows empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
      if (data.success) {
        if (decision === 'approve') {
          toast.success('Approved', data.executionNote || 'Action executed.');
        } else {
          toast.info('Rejected', 'The entity will learn from this.');
        }
        setRequests(prev => prev.filter(r => r.id !== req.id));
        setEditingId(null);
        setExpandedId(null);
      } else {
        toast.error('Decision failed', data.error);
      }
    } catch (e: any) {
      toast.error('Decision failed', e?.message);
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (req: ApprovalRequest) => {
    setEditingId(req.id);
    setExpandedId(req.id);
    setEditedText(String((req.payload as any)?.text ?? ''));
  };

  return (
    <div className="rounded-2xl bg-[rgba(13,13,22,0.55)] backdrop-blur-xl border border-white/[0.07] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.18em]">Entity · Propose-then-Approve</p>
          <h3 className="text-[15px] font-bold text-white mt-1 flex items-center gap-2">
            <ShieldCheck size={15} className="text-neon-purple" />
            Barry&apos;s Approval Queue
            <span className="text-[11px] font-mono font-normal text-neon-purple bg-neon-purple/10 px-1.5 py-0.5 rounded-full border border-neon-purple/20">
              {requests.length}
            </span>
          </h3>
        </div>
        <button
          onClick={load}
          className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-neon-cyan transition-colors cursor-pointer"
          title="Refresh queue"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {requests.length === 0 && !loading && (
        <div className="py-8 text-center text-[11px] font-mono text-white/25">
          ✓ Queue clear — nothing awaiting your decision
        </div>
      )}

      <AnimatePresence>
        {requests.map(req => {
          const payload = (req.payload ?? {}) as any;
          const expanded = expandedId === req.id;
          const editing = editingId === req.id;
          const busy = busyId === req.id;
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
                    {typeof req.confidence === 'number' && (
                      <span className="text-[9px] font-mono text-white/30">confidence {req.confidence}/10</span>
                    )}
                  </div>
                  <h4 className="text-[13px] font-semibold text-white mt-1.5 leading-snug">{req.title}</h4>
                  {req.recommendation && (
                    <p className="text-[11px] text-neon-cyan/70 mt-0.5 font-sans">↳ {req.recommendation}</p>
                  )}
                </div>
                <button
                  onClick={() => setExpandedId(expanded ? null : req.id)}
                  className="p-1 rounded-lg hover:bg-white/5 text-white/25 hover:text-white/60 transition-colors cursor-pointer shrink-0"
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

              <div className="flex items-center gap-2">
                {editing ? (
                  <button
                    disabled={busy}
                    onClick={() => decide(req, 'approve', { ...payload, text: editedText })}
                    className="flex items-center gap-1.5 text-[11px] font-mono text-neon-green bg-neon-green/10 border border-neon-green/25 px-3 py-1.5 rounded-lg hover:bg-neon-green/20 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Send size={11} /> {busy ? 'Executing…' : 'Approve edited'}
                  </button>
                ) : (
                  <button
                    disabled={busy}
                    onClick={() => decide(req, 'approve')}
                    className="flex items-center gap-1.5 text-[11px] font-mono text-neon-green bg-neon-green/10 border border-neon-green/25 px-3 py-1.5 rounded-lg hover:bg-neon-green/20 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Check size={11} /> {busy ? 'Executing…' : 'Approve'}
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
