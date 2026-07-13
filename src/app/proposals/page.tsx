'use client';

import React, { useEffect, useState } from 'react';
import { PageHeaderCard, VxIcon, VeltrixSpinner } from '@/components/ds';
import { db } from '@/lib/db';

interface Lead {
  id: string;
  business_name: string;
}

interface Proposal {
  id: string;
  lead_id?: string;
  client_id?: string;
  title: string;
  price: number;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Needs Revision';
  timeline?: string;
  problem?: string;
  solution?: string;
  deliverables: string[];
  payment_terms?: string;
  created_at: string;
}

const columnCardStyle: React.CSSProperties = {
  padding: 'var(--space-5)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-md), var(--sheen-top)',
  minHeight: 380,
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
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

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [leadId, setLeadId] = useState('');
  const [price, setPrice] = useState('1500');
  const [timeline, setTimeline] = useState('2 Weeks');
  const [deliverablesStr, setDeliverablesStr] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('50% Upfront, 50% on Completion');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const pData = await db.getProposals();
      setProposals(pData as Proposal[]);

      const lData = await db.getLeads();
      setLeads(lData as Lead[]);

      if (lData.length > 0) {
        setLeadId(lData[0].id);
      }
    } catch (err) {
      console.warn('Failed to load proposals directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getLeadName = (id?: string) => {
    if (!id) return 'Unassigned Prospect';
    const l = leads.find((l) => l.id === id);
    return l ? l.business_name : 'Unknown Prospect';
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !leadId) {
      setFormError('Proposal title and Lead assignment are required.');
      return;
    }
    setFormError(null);

    const deliverables = deliverablesStr
      .split('\n')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    try {
      await db.addProposal({
        lead_id: leadId,
        title,
        price: parseFloat(price) || 0,
        timeline,
        problem,
        solution,
        deliverables,
        payment_terms: paymentTerms,
        status: 'Draft',
      });

      // Clear Form
      setTitle('');
      setDeliverablesStr('');
      setProblem('');
      setSolution('');
      setPrice('1500');
      setIsModalOpen(false);

      // Refresh
      await fetchData();
    } catch (err: any) {
      setFormError(`Failed to save proposal: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Proposal['status']) => {
    try {
      await db.updateProposal(id, { status: newStatus });
      await fetchData();
    } catch (err) {
      console.warn('Failed to update proposal status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <VeltrixSpinner message="Connecting to Proposal catalog..." />
      </div>
    );
  }

  // Filter into Kanban columns
  const drafts = proposals.filter((p) => ['Draft', 'Needs Revision'].includes(p.status));
  const sent = proposals.filter((p) => ['Sent', 'Viewed'].includes(p.status));
  const accepted = proposals.filter((p) => p.status === 'Accepted');
  const rejected = proposals.filter((p) => p.status === 'Rejected');

  const pipelineValue = sent.reduce((sum, p) => sum + (p.price || 0), 0);
  const closedWonValue = accepted.reduce((sum, p) => sum + (p.price || 0), 0);

  const columns = [
    { name: 'Drafts', tone: 'var(--text-dim)', proposals: drafts, count: drafts.length },
    { name: 'Sent / Pending', tone: 'var(--cyan-300)', proposals: sent, count: sent.length },
    { name: 'Accepted (Won)', tone: 'var(--signal-400)', proposals: accepted, count: accepted.length },
    { name: 'Rejected', tone: 'var(--danger-400)', proposals: rejected, count: rejected.length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <PageHeaderCard
        icon="doc"
        title="Proposals Manager"
        subtitle="Orchestrate customized offers, prices, payment schedules, and track live signature states."
        stats={[
          { value: String(proposals.length), label: 'TOTAL PROPOSALS', color: 'var(--text-strong)' },
          { value: `$${(pipelineValue / 1000).toFixed(1)}K`, label: 'PENDING PIPELINE', color: 'var(--cyan-300)' },
          { value: `$${(closedWonValue / 1000).toFixed(1)}K`, label: 'CLOSED ACCEPTS', color: 'var(--signal-400)' },
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
            New Proposal
          </div>
        }
      />

      {/* Kanban Board */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-5)', alignItems: 'start' }}>
        {columns.map((col) => (
          <div key={col.name} className="vx-glass" style={columnCardStyle}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--hairline)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.tone, boxShadow: `0 0 8px ${col.tone}` }} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 700, color: 'var(--text-strong)' }}>
                  {col.name}
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--hairline)' }}>
                {col.count}
              </span>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {col.proposals.length > 0 ? (
                col.proposals.map((prop) => (
                  <div
                    key={prop.id}
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      background: 'var(--ink-700)',
                      border: '1px solid var(--hairline)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        ${prop.price.toLocaleString()}
                      </span>
                      {prop.timeline && (
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {prop.timeline}
                        </span>
                      )}
                    </div>
                    <h5 style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)' }}>
                      {prop.title}
                    </h5>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      Prospect: <span style={{ color: 'var(--violet-200)' }}>{getLeadName(prop.lead_id)}</span>
                    </p>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
                      {['Draft', 'Needs Revision'].includes(prop.status) && (
                        <button
                          onClick={() => handleUpdateStatus(prop.id, 'Sent')}
                          style={{
                            background: 'rgba(76,215,246,0.1)',
                            border: '1px solid rgba(76,215,246,0.2)',
                            color: 'var(--cyan-300)',
                            fontSize: 10.5,
                            padding: '3px 8px',
                            borderRadius: 4,
                            cursor: 'pointer',
                          }}
                        >
                          Send Offer
                        </button>
                      )}
                      {['Sent', 'Viewed'].includes(prop.status) && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(prop.id, 'Accepted')}
                            style={{
                              background: 'rgba(46,230,160,0.1)',
                              border: '1px solid rgba(46,230,160,0.2)',
                              color: 'var(--signal-400)',
                              fontSize: 10.5,
                              padding: '3px 8px',
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(prop.id, 'Rejected')}
                            style={{
                              background: 'rgba(239,68,68,0.06)',
                              border: '1px solid rgba(239,68,68,0.15)',
                              color: 'var(--danger-400)',
                              fontSize: 10.5,
                              padding: '3px 8px',
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  Empty Stage
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Create Proposal Modal */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[50] flex items-center justify-center p-6"
        >
          <form
            onSubmit={handleCreateProposal}
            className="vx-glass max-w-lg w-full p-6 rounded-2xl border border-white/[0.08] space-y-4"
            style={{ background: 'var(--grad-panel)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--hairline)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>
                Draft New Proposal Package
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

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Proposal Scope / Title *</label>
                <input style={inputStyle} type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AI Receptionist Onboarding & Setup" required />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Assign Lead Prospect *</label>
                <select style={inputStyle} value={leadId} onChange={(e) => setLeadId(e.target.value)} required>
                  {leads.length > 0 ? (
                    leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.business_name}
                      </option>
                    ))
                  ) : (
                    <option value="">No leads qualified</option>
                  )}
                </select>
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Price Offer ($)</label>
                <input style={inputStyle} type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1500" />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Project Timeline</label>
                <input style={inputStyle} type="text" value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="e.g. 3 Weeks" />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Payment Terms</label>
                <input style={inputStyle} type="text" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="50% Upfront, 50% Completion" />
              </div>
              <div className="col-span-2">
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Roadmap Deliverables (one per line)</label>
                <textarea
                  value={deliverablesStr}
                  onChange={(e) => setDeliverablesStr(e.target.value)}
                  placeholder="e.g.&#10;Design conversational flows&#10;Deploy voicebox synthesis backend&#10;Integrate live scheduling API"
                  style={{
                    width: '100%',
                    minHeight: 60,
                    padding: 10,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--ink-700)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-strong)',
                    fontSize: 13,
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Customer Objections / Problem Statement</label>
                <input style={inputStyle} type="text" value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Needs call automation..." />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Our Recommended Solution Scope</label>
                <input style={inputStyle} type="text" value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="Deploy Kokoro chatbot..." />
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
              Draft Proposal Offer
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
