'use client';

import React, { useEffect, useState } from 'react';
import { PageHeaderCard, VxIcon } from '@/components/ds';
import { db } from '@/lib/db';
import { authFetch } from '@/lib/authFetch';
import { SendStateBadge, SendDetails, SendButton, Notice, useSendAction } from '@/components/SendState';
import PageSkeleton from '@/components/PageSkeleton';

interface Lead {
  id: string;
  business_name: string;
  contact_name?: string;
  industry?: string;
}

interface Followup {
  id: string;
  lead_id: string;
  followup_date: string;
  followup_type: string;
  message?: string;
  status: 'Pending' | 'Drafted' | 'Approved' | 'Sending' | 'Sent' | 'Failed' | 'Completed' | 'Skipped';
  provider?: string | null;
  provider_message_id?: string | null;
  sent_at?: string | null;
  error?: string | null;
  attempts?: number | null;
  created_at: string;
}

const cmdCard: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--ink-700)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-strong)',
  fontFamily: 'var(--font-body)',
  fontSize: 13.5,
  outline: 'none',
  appearance: 'none',
  cursor: 'pointer',
};

const DAY_OPTIONS = [
  'Day 3: Friendly nudge',
  'Day 7: Value drop',
  'Day 14: Final check-in',
  'Day 30: Re-engagement',
];

export default function FollowUpsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer Form
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedDay, setSelectedDay] = useState(DAY_OPTIONS[0]);
  const [composerMessage, setComposerMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const refreshFollowups = async () => { setFollowups((await db.getFollowups()) as Followup[]); };
  const { busyId, notice, setNotice, run } = useSendAction(refreshFollowups);

  const fetchData = async () => {
    try {
      const lData = await db.getLeads();
      setLeads(lData as Lead[]);
      
      const fData = await db.getFollowups();
      setFollowups(fData as Followup[]);

      if (lData.length > 0) {
        setSelectedLeadId(lData[0].id);
      }
    } catch (err) {
      console.warn('Failed to load follow-ups dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { void fetchData(); }, 0);
    return () => clearTimeout(t);
  }, []);

  const getLeadName = (id: string) => {
    const l = leads.find(l => l.id === id);
    return l ? l.business_name : 'Unknown Prospect';
  };

  const handleCreateDraft = async () => {
    if (!selectedLeadId) return;
    setCreating(true);

    try {
      if (!composerMessage.trim()) {
        // No text typed: ask the Follow-up agent (Gemini) to write a real draft. No canned template is ever used.
        const day = parseInt(selectedDay.match(/\d+/)?.[0] || '3', 10);
        const res = await authFetch('/api/ai/followup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: selectedLeadId, sequenceDay: day }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          setNotice({ ok: false, text: `AI draft failed: ${data.error || res.status}${data.hint ? ' - ' + data.hint : ''}` });
        } else {
          setNotice({ ok: true, text: 'Draft created by the Follow-up agent. It is NOT sent: review it below, then approve & send.' });
        }
        setFollowups((await db.getFollowups()) as Followup[]);
        return;
      }
      const body = composerMessage.trim();
      await db.addFollowup({
        lead_id: selectedLeadId,
        followup_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        followup_type: selectedDay.split(':')[0],
        message: body,
        status: 'Drafted',
      });
      
      setComposerMessage('');
      // Reload lists
      const fData = await db.getFollowups();
      setFollowups(fData as Followup[]);
    } catch (err) {
      console.warn('Failed to create followup:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Followup['status']) => {
    try {
      await db.updateFollowup(id, { status: newStatus });
      const fData = await db.getFollowups();
      setFollowups(fData as Followup[]);
    } catch (err) {
      console.warn('Failed to update status:', err);
    }
  };

  if (loading) {
    return (
      <PageSkeleton label="Loading followup workflows..." />
    );
  }

  const scheduleList = followups.filter(f => ['Pending', 'Drafted', 'Approved', 'Sending', 'Failed'].includes(f.status));
  const completedList = followups.filter(f => ['Sent', 'Completed', 'Skipped'].includes(f.status));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <PageHeaderCard
        icon="refresh"
        title="Follow-ups Pipeline"
        subtitle="Lucas orchestrates lead retention sequences — nudging, dropping values, and re-engaging prospects."
        stats={[
          { value: String(scheduleList.length), label: 'NOT SENT YET', color: 'var(--warn-400)' },
          { value: String(followups.filter(f => f.status === 'Sent' && !!f.provider_message_id).length), label: 'CONFIRMED SENT', color: 'var(--signal-400)' },
        ]}
      />

      <Notice notice={notice} onClose={() => setNotice(null)} />

      <section style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Left lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Schedule list */}
          <div className="vx-glass" style={cmdCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-5)' }}>
              <span style={{ color: 'var(--magenta-300)', display: 'flex' }}>
                <VxIcon name="calendar" size={18} />
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--magenta-300)', textTransform: 'uppercase' }}>
                Active Follow-up Schedule
              </span>
            </div>

            {scheduleList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {scheduleList.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      background: 'var(--ink-700)',
                      border: '1px solid var(--hairline)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)' }}>
                        {getLeadName(f.lead_id)}
                      </span>
                      <SendStateBadge record={f} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--warn-400)' }}>
                        {f.followup_type.toUpperCase()} · Due {f.followup_date}
                      </span>
                    </div>
                    {f.message && (
                      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.45, fontStyle: 'italic' }}>
                        &ldquo;{f.message}&rdquo;
                      </p>
                    )}
                    <SendDetails record={f} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, justifyContent: 'flex-end' }}>
                      {f.status === 'Failed' ? (
                        <SendButton label="Retry send" tone="warn" busy={busyId === f.id} onClick={() => run('followups', f.id, { retry: true })} />
                      ) : f.status !== 'Sending' ? (
                        <>
                          <SendButton label="Approve & send" tone="info" busy={busyId === f.id} onClick={() => run('followups', f.id)} title="Approves and emails this follow-up to the lead now" />
                          <SendButton label="Mark sent (I sent it)" tone="ok" busy={busyId === f.id} onClick={() => run('followups', f.id, { manual: true })} title="You sent it yourself outside the app. Records your confirmation only." />
                        </>
                      ) : null}
                      <button
                        onClick={() => handleUpdateStatus(f.id, 'Skipped')}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--hairline)',
                          color: 'var(--text-dim)',
                          fontSize: 11,
                          padding: '4px 10px',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--text-dim)', fontSize: 12.5, fontFamily: 'var(--font-mono)' }}>
                No active follow-up reminders at this time.
              </div>
            )}
          </div>

          {/* Log list */}
          <div className="vx-glass" style={cmdCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-5)' }}>
              <span style={{ color: 'var(--signal-400)', display: 'flex' }}>
                <VxIcon name="check" size={18} />
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--signal-400)', textTransform: 'uppercase' }}>
                Completed Log
              </span>
            </div>

            {completedList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {completedList.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      padding: 12,
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--hairline)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>
                        {getLeadName(f.lead_id)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                        {f.followup_type} · Action: {f.status}
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                      {f.followup_date}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--text-dim)', fontSize: 12.5, fontFamily: 'var(--font-mono)' }}>
                No follow-ups have been logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Right card composer */}
        <div
          className="vx-glass"
          style={{
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(155deg, rgba(217,70,239,0.06), rgba(10,7,26,0.5))',
            border: '1px solid rgba(217,70,239,0.22)',
            boxShadow: 'var(--shadow-lg), var(--sheen-top)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-5)' }}>
            <span style={{ color: 'var(--magenta-300)', display: 'flex' }}>
              <VxIcon name="refresh" size={18} />
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--magenta-300)', textTransform: 'uppercase' }}>
              Create Follow-up Draft
            </span>
          </div>

          <div className="vx-eyebrow" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
            Select Potential Client (Lead)
          </div>
          <select aria-label="Potential client (lead)"
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            style={selectStyle}
          >
            {leads.length > 0 ? (
              leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.business_name}
                </option>
              ))
            ) : (
              <option value="">No leads in database</option>
            )}
          </select>

          <div className="vx-eyebrow" style={{ color: 'var(--text-muted)', margin: 'var(--space-5) 0 8px' }}>
            Select Follow-up Stage
          </div>
          <select aria-label="Follow-up stage"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            style={selectStyle}
          >
            {DAY_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          <div className="vx-eyebrow" style={{ color: 'var(--text-muted)', margin: 'var(--space-5) 0 8px' }}>
            Custom Message Body (Optional)
          </div>
          <textarea
            value={composerMessage}
            onChange={(e) => setComposerMessage(e.target.value)}
            placeholder="Let AI outline standard templates or compose custom details here..."
            style={{
              width: '100%',
              minHeight: 100,
              padding: 12,
              borderRadius: 'var(--radius-md)',
              background: 'var(--ink-700)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-strong)',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              outline: 'none',
              resize: 'none',
            }}
          />

          <button
            onClick={handleCreateDraft}
            disabled={creating || !selectedLeadId}
            style={{
              width: '100%',
              marginTop: 'var(--space-6)',
              padding: '14px 0',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #D946EF, #8B5CF6)',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: 13.5,
              fontWeight: 700,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 0 22px rgba(217,70,239,0.4)',
              opacity: creating ? 0.6 : 1,
            }}
          >
            {creating ? 'Drafting...' : 'Create Draft with AI'}
          </button>
        </div>
      </section>
    </div>
  );
}
