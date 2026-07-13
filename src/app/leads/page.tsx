'use client';

import React, { useEffect, useState } from 'react';
import { PageHeaderCard, VxIcon, VeltrixSpinner } from '@/components/ds';
import { db } from '@/lib/db';
import ScraperControl from '@/components/ScraperControl';
import ScraperImport from '@/components/ScraperImport';

const STAGE_KEYS = {
  prospecting: ['New', 'Researched'],
  qualified: ['Qualified', 'Contacted', 'Replied'],
  proposal: ['Proposal Sent', 'Call Booked'],
  won: ['Won'],
};

interface Lead {
  id: string;
  business_name: string;
  contact_name?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  location?: string;
  pain_point?: string;
  lead_score: number;
  status: string;
  notes?: string;
  created_at: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScraperOpen, setIsScraperOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const loadLeads = async () => {
    try {
      const data = await db.getLeads();
      setLeads(data);
    } catch (err) {
      console.warn('Failed to load leads from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const getDealValue = (l: Lead) => {
    // Generate a clean, realistic estimated deal value based on lead score
    if (l.lead_score >= 8) return 2500;
    if (l.lead_score >= 6) return 1800;
    return 1200;
  };

  const getScoreColor = (score: number) => {
    if (score >= 7.5) return 'var(--signal-400)';
    if (score >= 5.0) return 'var(--warn-400)';
    return 'var(--text-muted)';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <VeltrixSpinner message="Loading lead database..." />
      </div>
    );
  }

  // Filter leads by stage mapping
  const prospectingLeads = leads.filter((l) => STAGE_KEYS.prospecting.includes(l.status));
  const qualifiedLeads = leads.filter((l) => STAGE_KEYS.qualified.includes(l.status));
  const proposalLeads = leads.filter((l) => STAGE_KEYS.proposal.includes(l.status));
  const wonLeads = leads.filter((l) => STAGE_KEYS.won.includes(l.status));

  // Compute stats
  const totalValue = leads.reduce((sum, l) => sum + getDealValue(l), 0);
  const wonValue = wonLeads.reduce((sum, l) => sum + getDealValue(l), 0);

  const pipelineColumns = [
    {
      name: 'Prospecting',
      tone: 'var(--cyan-400)',
      leads: prospectingLeads,
      count: prospectingLeads.length,
      value: prospectingLeads.reduce((sum, l) => sum + getDealValue(l), 0),
    },
    {
      name: 'Qualified',
      tone: 'var(--violet-300)',
      leads: qualifiedLeads,
      count: qualifiedLeads.length,
      value: qualifiedLeads.reduce((sum, l) => sum + getDealValue(l), 0),
    },
    {
      name: 'Proposal',
      tone: 'var(--warn-400)',
      leads: proposalLeads,
      count: proposalLeads.length,
      value: proposalLeads.reduce((sum, l) => sum + getDealValue(l), 0),
    },
    {
      name: 'Closed Won',
      tone: 'var(--signal-400)',
      leads: wonLeads,
      count: wonLeads.length,
      value: wonValue,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <PageHeaderCard
        icon="users"
        title="Leads Pipeline"
        subtitle="Manage your prospective clients, qualify their automation needs, and track deal stages."
        stats={[
          { value: String(leads.length), label: 'TOTAL LEADS', color: 'var(--text-strong)' },
          { value: `$${(totalValue / 1000).toFixed(0)}K`, label: 'PIPELINE EST', color: 'var(--cyan-300)' },
          { value: `$${(wonValue / 1000).toFixed(0)}K`, label: 'CLOSED WON', color: 'var(--signal-400)' },
        ]}
        action={
          <div
            onClick={() => setIsScraperOpen(true)}
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
            <span style={{ display: 'flex' }}>
              <VxIcon name="plus" size={16} color="#fff" />
            </span>
            Scrape Leads
          </div>
        }
      />

      {/* Pipeline Board */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-5)', alignItems: 'stretch' }}>
        {pipelineColumns.map((col) => (
          <div
            key={col.name}
            className="vx-glass"
            style={{
              padding: 'var(--space-5)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--grad-panel)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-md), var(--sheen-top)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.tone, boxShadow: `0 0 8px ${col.tone}` }} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>
                  {col.name}
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-dim)' }}>
                {col.count}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--cyan-300)', marginBottom: 'var(--space-4)' }}>
              ${col.value.toLocaleString()}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {col.leads.length > 0 ? (
                col.leads.map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => setSelectedLead(deal)}
                    style={{
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--ink-700)',
                      border: '1px solid var(--hairline)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    className="hover:border-white/20"
                  >
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)' }}>
                      {deal.business_name}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-body)' }}>
                        ${getDealValue(deal).toLocaleString()}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {deal.lead_score > 0 && (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 9.5,
                              fontWeight: 700,
                              color: getScoreColor(deal.lead_score),
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--hairline)',
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {deal.lead_score}
                          </span>
                        )}
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {deal.industry || 'Lead'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--space-6) 0', color: 'var(--text-dim)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  No leads
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Scraper Drawer / Modal */}
      {isScraperOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) { setIsScraperOpen(false); loadLeads(); }
          }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[50] flex items-center justify-center p-6"
        >
          <div
            className="vx-glass max-w-4xl w-full max-h-[85vh] overflow-y-auto p-6 rounded-2xl border border-white/[0.08]"
            style={{ background: 'var(--grad-panel)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--hairline)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-strong)' }}>
                Autonomous Lead Scout
              </h3>
              <button
                onClick={() => { setIsScraperOpen(false); loadLeads(); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
              >
                <span style={{ fontSize: 20, color: 'var(--text-muted)' }}>×</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ScraperControl />
              <ScraperImport onClose={() => { setIsScraperOpen(false); loadLeads(); }} onImported={loadLeads} />
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {selectedLead && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLead(null);
          }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[50] flex items-center justify-center p-6"
        >
          <div
            className="vx-glass max-w-xl w-full p-6 rounded-2xl border border-white/[0.08]"
            style={{ background: 'var(--grad-panel)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--hairline)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-strong)' }}>
                  {selectedLead.business_name}
                </h3>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  ID: {selectedLead.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
              >
                <span style={{ fontSize: 20, color: 'var(--text-muted)' }}>×</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Contact information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>LOCATION</div>
                  <div style={{ fontSize: 13, color: 'var(--text-strong)', marginTop: 2 }}>{selectedLead.location || 'Not Specified'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>WEBSITE</div>
                  <div style={{ fontSize: 13, color: 'var(--text-strong)', marginTop: 2 }}>
                    {selectedLead.website ? (
                      <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan-300)' }}>
                        {selectedLead.website}
                      </a>
                    ) : (
                      'None'
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>EMAIL</div>
                  <div style={{ fontSize: 13, color: 'var(--text-strong)', marginTop: 2 }}>{selectedLead.email || 'None'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>PHONE</div>
                  <div style={{ fontSize: 13, color: 'var(--text-strong)', marginTop: 2 }}>{selectedLead.phone || 'None'}</div>
                </div>
              </div>

              {/* Status and Score */}
              <div style={{ padding: 12, borderRadius: 8, background: 'var(--ink-700)', border: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>CURRENT STATUS</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginTop: 2 }}>{selectedLead.status}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>LEAD SCORE</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: getScoreColor(selectedLead.lead_score), marginTop: 2 }}>{selectedLead.lead_score} / 10</div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>NOTES & RESEARCH BRIEF</div>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--hairline)',
                    fontSize: 12.5,
                    color: 'var(--text-body)',
                    maxHeight: 180,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                  }}
                >
                  {selectedLead.notes || 'No research notes found for this lead.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
