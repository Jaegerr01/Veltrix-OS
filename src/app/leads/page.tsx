'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Lead } from '@/lib/types';
import LeadTable from '@/components/LeadTable';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import { Users, Plus, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LeadsCRM() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterScore, setFilterScore] = useState<string>('All');

  // Loading indicator states by leadId
  const [scoringMap, setScoringMap] = useState<Record<string, boolean>>({});
  const [draftingMap, setDraftingMap] = useState<Record<string, boolean>>({});
  const [proposalMap, setProposalMap] = useState<Record<string, boolean>>({});

  // Add lead form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [location, setLocation] = useState('');
  const [painPoint, setPainPoint] = useState('');
  const [source, setSource] = useState('Cold Research');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadLeads() {
    try {
      const res = await fetch('/api/leads');
      const json = await res.json();
      if (json.success) {
        setLeads(json.data || []);
      } else {
        throw new Error(json.error || 'Failed to fetch leads');
      }
    } catch (e) {
      console.error(e);
      try {
        const lds = await db.getLeads();
        setLeads(lds);
      } catch (err) {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  // 1. AI Score Lead
  const handleScoreLead = async (leadId: string) => {
    setScoringMap(prev => ({ ...prev, [leadId]: true }));
    try {
      const res = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId })
      });
      const data = await res.json();
      if (data.success) {
        await loadLeads();
      } else {
        alert(data.error || 'Failed to score lead');
      }
    } catch (e) {
      console.error(e);
      alert('Error triggering AI lead scoring');
    } finally {
      setScoringMap(prev => ({ ...prev, [leadId]: false }));
    }
  };

  // 2. AI Draft Outreach
  const handleDraftOutreach = async (leadId: string) => {
    setDraftingMap(prev => ({ ...prev, [leadId]: true }));
    try {
      const lead = leads.find(l => l.id === leadId);
      const isChatbot = lead?.pain_point?.toLowerCase().includes('receptionist') || lead?.pain_point?.toLowerCase().includes('call') || lead?.industry === 'Dental';
      const offer = isChatbot ? 'AI Receptionist / Lead Booking Agent' : 'AI Website + Brand System';

      const res = await fetch('/api/ai/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, offerName: offer, channel: 'Email' })
      });
      const data = await res.json();
      if (data.success) {
        alert('Personalized outreach message successfully drafted! Forwarding to Outbox (Messages)...');
        router.push('/outreach');
      } else {
        alert(data.error || 'Failed to draft outreach');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDraftingMap(prev => ({ ...prev, [leadId]: false }));
    }
  };

  // 3. AI Draft Proposal
  const handleDraftProposal = async (leadId: string) => {
    setProposalMap(prev => ({ ...prev, [leadId]: true }));
    try {
      const lead = leads.find(l => l.id === leadId);
      const isChatbot = lead?.pain_point?.toLowerCase().includes('receptionist') || lead?.industry === 'Dental';
      const offer = isChatbot ? 'AI Receptionist' : 'Website + Brand System';
      const price = isChatbot ? 1000 : 1500;

      const res = await fetch('/api/ai/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, offerName: offer, price })
      });
      const data = await res.json();
      if (data.success) {
        alert('Client proposal drafted! Forwarding to Price Quotes & Proposals...');
        router.push('/proposals');
      } else {
        alert(data.error || 'Failed to draft proposal');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProposalMap(prev => ({ ...prev, [leadId]: false }));
    }
  };

  // 4. AI Create Followup Reminder
  const handleCreateFollowup = async (leadId: string) => {
    setScoringMap(prev => ({ ...prev, [leadId]: true }));
    try {
      const res = await fetch('/api/ai/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentKey: 'followup',
          params: { leadId, sequenceDay: 3 }
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.result);
        router.push('/follow-ups');
      } else {
        alert(data.error || 'Failed to create follow-up');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScoringMap(prev => ({ ...prev, [leadId]: false }));
    }
  };

  // 5. Update Status manually in dropdown
  const handleUpdateStatus = async (leadId: string, status: Lead['status']) => {
    try {
      await db.updateLead(leadId, { status });
      await loadLeads();
    } catch (err) {
      console.error(err);
      alert('Failed to update lead status');
    }
  };

  // 6. Delete Lead
  const handleDeleteLead = async (leadId: string) => {
    if (confirm('Are you sure you want to remove this lead?')) {
      const deleted = await db.deleteLead(leadId);
      if (deleted) loadLeads();
    }
  };

  // 7. Create Manual Lead
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          contact_name: contactName || null,
          industry: industry || null,
          website: website || null,
          email: email || null,
          phone: phone || null,
          social_link: socialLink || null,
          location: location || null,
          pain_point: painPoint || null,
          lead_score: 0.0,
          status: 'New',
          source: source,
          notes: notes || null
        })
      });

      const json = await res.json();
      if (json.success) {
        setBusinessName('');
        setContactName('');
        setIndustry('');
        setWebsite('');
        setEmail('');
        setPhone('');
        setSocialLink('');
        setLocation('');
        setPainPoint('');
        setNotes('');
        setShowAddForm(false);
        await loadLeads();
      } else {
        alert('Failed to add lead: ' + json.error);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error adding lead: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="LOADING POTENTIAL CLIENTS..." />;
  }

  // Filter logic
  const filteredLeads = leads.filter(l => {
    const statusMatch = filterStatus === 'All' || l.status === filterStatus;
    
    let scoreMatch = true;
    if (filterScore === 'Hot') scoreMatch = l.lead_score >= 8.0;
    else if (filterScore === 'Warm') scoreMatch = l.lead_score >= 5.0 && l.lead_score < 8.0;
    else if (filterScore === 'Cold') scoreMatch = l.lead_score > 0.0 && l.lead_score < 5.0;
    else if (filterScore === 'Unscored') scoreMatch = l.lead_score === 0.0;

    return statusMatch && scoreMatch;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Action Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 text-neon-cyan">
          <Users size={20} />
          <span className="font-mono text-sm font-bold uppercase tracking-wider">Potential Clients (Leads)</span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/85 text-black rounded text-xs font-mono font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
        >
          <Plus size={14} />
          <span>{showAddForm ? 'HIDE FORM' : 'ADD A LEAD'}</span>
        </button>
      </div>

      {/* Add Lead Form Modal Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cyber-bg/85 backdrop-blur-md animate-fade-in">
          <div className="glass-panel p-6 border border-neon-cyan/40 rounded-xl bg-cyber-bg/95 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(6,182,212,0.25)] space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h4 className="text-sm font-mono font-bold text-neon-cyan uppercase tracking-wider">
                Add a Potential Client (Lead)
              </h4>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-muted-foreground hover:text-neon-pink font-mono text-xs cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            
            <form onSubmit={handleAddLead} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                  placeholder="Radiant Smiles Dental Clinic"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Contact Person Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                  placeholder="e.g. Dr. Sarah Jenkins"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                  placeholder="Dental"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Website URL</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                  placeholder="http://example.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Contact Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                  placeholder="info@radiant.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                  placeholder="555-0120"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Social URL (IG/LinkedIn)</label>
                <input
                  type="text"
                  value={socialLink}
                  onChange={(e) => setSocialLink(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                  placeholder="instagram.com/radiant"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Physical Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                  placeholder="Austin, TX"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">How we found them</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition font-mono"
                >
                  <option value="Cold Research">Cold Research</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Instagram">Instagram DM</option>
                  <option value="Inbound">Inbound Site Request</option>
                  <option value="Referral">Client Referral</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Problems we noticed (Pain Points)</label>
                <textarea
                  value={painPoint}
                  onChange={(e) => setPainPoint(e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded p-3 text-foreground focus:outline-none focus:border-neon-cyan transition"
                  placeholder="e.g. Website is slow, no online booking form, no chat assistants..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Administrative Notes / Context</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded p-3 text-foreground focus:outline-none focus:border-neon-cyan transition"
                  placeholder="e.g. Key decision maker is Sarah. Spoke briefly on IG, highly interested in automation."
                />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-white/10 rounded text-muted-foreground hover:bg-white/5 transition cursor-pointer font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/80 text-black rounded font-mono font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'SAVING...' : 'SAVE LEAD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter panel */}
      <div className="p-4 glass-panel border border-white/5 rounded-xl bg-cyber-bg/40 flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2 text-muted-foreground font-mono text-xs">
          <Filter size={14} />
          <span>FILTER BY:</span>
        </div>

        {/* Status selection */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-neon-cyan font-mono"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Researched">Researched</option>
            <option value="Qualified">Qualified</option>
            <option value="Contacted">Contacted</option>
            <option value="Replied">Replied</option>
            <option value="Call Booked">Call Booked</option>
            <option value="Proposal Sent">Proposal Sent</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>
        </div>

        {/* Score filter */}
        <div>
          <select
            value={filterScore}
            onChange={(e) => setFilterScore(e.target.value)}
            className="bg-white/5 border border-white/10 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-neon-cyan font-mono"
          >
            <option value="All">All Match Levels</option>
            <option value="Hot">Best Matches (Hot)</option>
            <option value="Warm">Good Matches (Warm)</option>
            <option value="Cold">Weak Matches (Cold)</option>
            <option value="Unscored">Not Scored Yet</option>
          </select>
        </div>
      </div>

      {/* Leads Table listing */}
      {filteredLeads.length > 0 ? (
        <LeadTable
          leads={filteredLeads}
          onScoreLead={handleScoreLead}
          onDraftOutreach={handleDraftOutreach}
          onDraftProposal={handleDraftProposal}
          onUpdateStatus={handleUpdateStatus}
          onCreateFollowup={handleCreateFollowup}
          onDeleteLead={handleDeleteLead}
          scoringMap={scoringMap}
          draftingMap={draftingMap}
          proposalMap={proposalMap}
        />
      ) : (
        <EmptyState 
          title="No Leads Found" 
          description="Try changing your filters or add a new lead to start." 
          actionLabel="Add a Lead" 
          onAction={() => setShowAddForm(true)} 
        />
      )}
    </div>
  );
}
