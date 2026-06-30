'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Proposal, Lead } from '@/lib/types';
import { authFetch } from '@/lib/authFetch';
import ProposalCard from '@/components/ProposalCard';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import { FileText, Plus, FileEdit, HelpCircle } from 'lucide-react';

export default function ProposalsCenter() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states to generate proposal
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [offerName, setOfferName] = useState('AI Website + Brand System');
  const [price, setPrice] = useState('');
  const [generating, setGenerating] = useState(false);

  // Detail viewer drawer
  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);

  async function loadData() {
    try {
      const props = await db.getProposals();
      const lds = await db.getLeads();
      setProposals(props);
      setLeads(lds);
    } catch (e) {
      console.warn('Failed to load proposals or leads data:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: Proposal['status']) => {
    try {
      await db.updateProposal(id, { status: newStatus });
      await loadData();
      if (activeProposal?.id === id) {
        // reload active proposal detail view
        const props = await db.getProposals();
        const updated = props.find(p => p.id === id);
        setActiveProposal(updated || null);
      }
      if (newStatus === 'Accepted') {
        alert('Proposal Accepted! This client has been added to My Clients, a new Project Checklist has been created, and the setup fee has been added to your Earnings.');
      } else {
        alert(`Proposal marked as ${newStatus}!`);
      }
    } catch (err) {
      console.warn('Failed to update proposal status:', err);
    }
  };

  const handleGenerateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || generating) return;

    setGenerating(true);
    try {
      const res = await authFetch('/api/ai/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId,
          offerName,
          price: Number(price) || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLeadId('');
        setPrice('');
        await loadData();
        alert('Proposal draft generated and saved!');
      } else {
        alert(data.error || 'Failed to generate proposal');
      }
    } catch (err) {
      console.warn('Failed to generate proposal via AI:', err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <LoadingState message="LOADING PROPOSALS..." />;
  }

  const getLeadName = (leadId?: string) => {
    if (!leadId) return 'N/A';
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.business_name : 'Unknown Target';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Left Column: Proposals grid */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center space-x-2 text-neon-cyan">
          <FileText size={20} />
          <span className="font-mono text-sm font-bold uppercase tracking-wider">Price Quotes & Proposals</span>
        </div>

        {proposals.length === 0 ? (
          <EmptyState
            title="No Proposals Created Yet"
            description="Use the AI writer on the right to create a new price quote for a lead."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {proposals.map((prop) => (
              <ProposalCard
                key={prop.id}
                proposal={prop}
                onUpdateStatus={handleUpdateStatus}
                onViewDetails={setActiveProposal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Inspector and Form */}
      <div className="lg:col-span-4 space-y-6">
        {/* Solution Inspector */}
        {activeProposal && (
          <div className="glass-panel p-6 border border-neon-cyan/40 rounded-xl bg-neon-cyan/5 neon-glow-cyan">
            <div className="flex justify-between items-center mb-4">
              <span className="font-mono text-xs font-bold text-neon-cyan uppercase">Proposal Text Review</span>
              <button
                onClick={() => setActiveProposal(null)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-mono text-muted-foreground uppercase block">Client Name</span>
                <span className="text-xs font-bold text-foreground">{getLeadName(activeProposal.lead_id)}</span>
              </div>

              <div>
                <span className="text-[9px] font-mono text-muted-foreground uppercase block">Proposed Price</span>
                <span className="text-xs text-neon-green font-mono font-bold">${activeProposal.price.toLocaleString()}</span>
              </div>

              <div>
                <span className="text-[9px] font-mono text-muted-foreground uppercase block mb-1">Proposal details</span>
                <div className="p-3 bg-cyber-bg border border-white/10 rounded text-xs leading-relaxed text-foreground select-text font-mono whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {activeProposal.solution}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                {activeProposal.status !== 'Accepted' && (
                  <button
                    onClick={() => handleUpdateStatus(activeProposal.id, 'Accepted')}
                    className="flex-1 py-2 bg-neon-green hover:bg-neon-green/80 text-white rounded font-mono font-bold text-[10px] uppercase transition cursor-pointer"
                  >
                    Accept Proposal
                  </button>
                )}
                {activeProposal.status === 'Draft' && (
                  <button
                    onClick={() => handleUpdateStatus(activeProposal.id, 'Sent')}
                    className="flex-1 py-2 bg-neon-purple hover:bg-neon-purple/80 text-white rounded font-mono font-bold text-[10px] uppercase transition cursor-pointer"
                  >
                    Mark Sent
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Generate draft form */}
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30">
          <div className="flex items-center space-x-2 text-neon-cyan mb-4">
            <FileEdit size={18} />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
              Create Proposal using AI
            </h3>
          </div>

          <form onSubmit={handleGenerateProposal} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Select Potential Client (Lead)</label>
              <select
                required
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              >
                <option value="">Select a prospect...</option>
                {leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').map(l => (
                  <option key={l.id} value={l.id}>{l.business_name} ({l.status})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Select Service Package</label>
              <select
                value={offerName}
                onChange={(e) => setOfferName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              >
                <option value="AI Website + Brand System">AI Website + Brand System</option>
                <option value="AI Receptionist / Lead Booking Agent">AI Receptionist / Chat Widget</option>
                <option value="Creative Tech Growth Package">Creative Tech Growth Package</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Price (in Dollars)</label>
              <input
                type="number"
                placeholder="e.g. 1500 (Optional)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              />
            </div>

            <button
              type="submit"
              disabled={generating || !selectedLeadId}
              className="w-full py-2 bg-neon-cyan hover:bg-neon-cyan/80 text-black rounded font-mono font-bold text-xs tracking-wider transition uppercase cursor-pointer disabled:opacity-50"
            >
              {generating ? 'WRITING PROPOSAL...' : 'CREATE PROPOSAL WITH AI'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
