'use client';

import React, { useEffect, useState } from 'react';
import { PageHeaderCard, VxIcon, VeltrixSpinner } from '@/components/ds';
import { db } from '@/lib/db';

interface Lead {
  id: string;
  business_name: string;
}

interface OutreachMessage {
  id: string;
  lead_id: string;
  channel: 'Email' | 'LinkedIn' | 'Instagram' | 'WhatsApp' | 'Facebook' | 'Discord';
  message: string;
  status: 'Draft' | 'Approved' | 'Sent' | 'Replied' | 'Failed';
  approval_status: 'Pending Approval' | 'Approved' | 'Rejected';
  sent_at?: string;
  created_at: string;
}

const messageCardStyle: React.CSSProperties = {
  padding: 'var(--space-5)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-md), var(--sheen-top)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const inputStyle: React.CSSProperties = {
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
};

export default function OutreachPage() {
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Draft' | 'Approved' | 'Sent'>('Draft');

  // Form State
  const [leadId, setLeadId] = useState('');
  const [channel, setChannel] = useState<OutreachMessage['channel']>('Email');
  const [body, setBody] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const mData = await db.getOutreachMessages();
      setMessages(mData as OutreachMessage[]);

      const lData = await db.getLeads();
      setLeads(lData as Lead[]);

      if (lData.length > 0) {
        setLeadId(lData[0].id);
      }
    } catch (err) {
      console.warn('Failed to load outreach logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getLeadName = (id: string) => {
    const l = leads.find((l) => l.id === id);
    return l ? l.business_name : 'Unknown Recipient';
  };

  const handleCreateOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !body.trim()) {
      setFormError('Lead and message body are required.');
      return;
    }
    setFormError(null);

    try {
      await db.addOutreachMessage({
        lead_id: leadId,
        channel,
        message: body,
        status: 'Draft',
        approval_status: 'Pending Approval',
      });

      setBody('');
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setFormError(`Failed to save message: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (id: string, updates: Partial<OutreachMessage>) => {
    try {
      await db.updateOutreachMessage(id, updates);
      await fetchData();
    } catch (err) {
      console.warn('Failed to update outreach state:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <VeltrixSpinner message="Synchronizing outreach sequences..." />
      </div>
    );
  }

  // Filter messages by activeTab
  const filteredMessages = messages.filter((m) => {
    if (activeTab === 'Draft') return m.status === 'Draft';
    if (activeTab === 'Approved') return m.status === 'Approved';
    return m.status === 'Sent' || m.status === 'Replied' || m.status === 'Failed';
  });

  const getChannelColor = (ch: OutreachMessage['channel']) => {
    if (ch === 'Email') return 'var(--cyan-300)';
    if (ch === 'LinkedIn') return 'var(--violet-300)';
    return 'var(--warn-400)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <PageHeaderCard
        icon="send"
        title="Outreach Sequences"
        subtitle="Manage automated and manual customer outreach drafts, review queues, and channel deliveries."
        stats={[
          { value: String(messages.filter(m => m.status === 'Draft').length), label: 'DRAFTS', color: 'var(--text-dim)' },
          { value: String(messages.filter(m => m.status === 'Approved').length), label: 'APPROVED QUEUE', color: 'var(--cyan-300)' },
          { value: String(messages.filter(m => ['Sent', 'Replied'].includes(m.status)).length), label: 'SENT DELIVERIES', color: 'var(--signal-400)' },
        ]}
        action={
          <div
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 18px',
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'var(--grad-brand)',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--glow-violet)',
              whiteSpace: 'nowrap',
            }}
          >
            <VxIcon name="plus" size={15} color="#fff" />
            Compose Message
          </div>
        }
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--hairline)', paddingBottom: 10 }}>
        {(['Draft', 'Approved', 'Sent'] as const).map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 13.5,
              fontWeight: 700,
              color: activeTab === tab ? 'var(--text-strong)' : 'var(--text-dim)',
              borderBottom: activeTab === tab ? '2px solid var(--violet-400)' : 'none',
              padding: '6px 16px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              transition: 'color 0.2s ease',
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Message Feed */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => (
            <div key={msg.id} className="vx-glass" style={messageCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: getChannelColor(msg.channel),
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--hairline)',
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}
                >
                  {msg.channel.toUpperCase()}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(msg.created_at).toLocaleDateString()}
                </span>
              </div>

              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>RECIPIENT</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)', marginTop: 2 }}>
                  {getLeadName(msg.lead_id)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>BODY</div>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    background: 'var(--ink-700)',
                    border: '1px solid var(--hairline)',
                    fontSize: 12.5,
                    color: 'var(--text-body)',
                    lineHeight: 1.45,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.message}
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                {msg.status === 'Draft' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(msg.id, { status: 'Approved', approval_status: 'Approved' })}
                      style={{
                        background: 'rgba(46,230,160,0.1)',
                        border: '1px solid rgba(46,230,160,0.2)',
                        color: 'var(--signal-400)',
                        fontSize: 11,
                        padding: '4px 10px',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(msg.id, { approval_status: 'Rejected' })}
                      style={{
                        background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        color: 'var(--danger-400)',
                        fontSize: 11,
                        padding: '4px 10px',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      Reject
                    </button>
                  </>
                )}
                {msg.status === 'Approved' && (
                  <button
                    onClick={() => handleUpdateStatus(msg.id, { status: 'Sent', sent_at: new Date().toISOString() })}
                    style={{
                      background: 'rgba(76,215,246,0.1)',
                      border: '1px solid rgba(76,215,246,0.2)',
                      color: 'var(--cyan-300)',
                      fontSize: 11,
                      padding: '4px 12px',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    Send Now
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: 'var(--space-10) 0',
              color: 'var(--text-dim)',
              fontSize: 13.5,
              fontFamily: 'var(--font-mono)',
            }}
          >
            No outreach messages in this folder.
          </div>
        )}
      </section>

      {/* Compose Modal */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[50] flex items-center justify-center p-6"
        >
          <form
            onSubmit={handleCreateOutreach}
            className="vx-glass max-w-md w-full p-6 rounded-2xl border border-white/[0.08] space-y-4"
            style={{ background: 'var(--grad-panel)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--hairline)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>
                Draft Outreach Message
              </h3>
              <span style={{ cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }} onClick={() => setIsModalOpen(false)}>
                ×
              </span>
            </div>

            {formError && (
              <div style={{ color: 'var(--danger-400)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                ⚠️ {formError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Assign Recipient (Lead) *</label>
                <select style={inputStyle} value={leadId} onChange={(e) => setLeadId(e.target.value)} required>
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
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Outreach Channel</label>
                <select style={inputStyle} value={channel} onChange={(e) => setChannel(e.target.value as any)}>
                  <option value="Email">Email</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Instagram">Instagram</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Discord">Discord</option>
                </select>
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Message Body *</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Hey, noticed you didn't have a website..."
                  required
                  style={{
                    width: '100%',
                    minHeight: 120,
                    padding: 10,
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
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                height: 42,
                borderRadius: 'var(--radius-md)',
                background: 'var(--grad-brand)',
                color: '#fff',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                border: 'none',
                boxShadow: 'var(--glow-violet)',
                marginTop: 8,
              }}
            >
              Queue Outreach Draft
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
