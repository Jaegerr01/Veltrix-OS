'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Followup, Lead } from '@/lib/types';
import { authFetch } from '@/lib/authFetch';
import LoadingState from '@/components/LoadingState';
import StatusBadge from '@/components/StatusBadge';
import { Calendar, RefreshCw, Send, Eye, Check, X, ShieldAlert } from 'lucide-react';

export default function FollowupCenter() {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick form generating follow-up
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [sequenceDay, setSequenceDay] = useState<number>(3);
  const [generating, setGenerating] = useState(false);

  // Inspector
  const [activeFup, setActiveFup] = useState<Followup | null>(null);

  async function loadData() {
    try {
      const fups = await db.getFollowups();
      const lds = await db.getLeads();
      setFollowups(fups);
      setLeads(lds);
    } catch (e) {
      console.warn('Failed to load follow-ups or leads data:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkCompleted = async (fupId: string) => {
    try {
      await db.updateFollowup(fupId, { status: 'Completed' });
      // Complete tasks linked to this follow-up
      const tks = await db.getTasks();
      const fup = followups.find(f => f.id === fupId);
      const task = tks.find(t => t.related_lead_id === fup?.lead_id && t.title.toLowerCase().includes('follow up'));
      if (task) {
        await db.updateTask(task.id, { status: 'Completed', result: 'Follow-up sent.' });
      }

      await loadData();
      if (activeFup?.id === fupId) {
        setActiveFup(null);
      }
      alert('Follow-up marked as Completed!');
    } catch (e) {
      console.warn('Failed to mark follow-up completed:', e);
    }
  };

  const handleSkip = async (fupId: string) => {
    if (confirm('Skip this follow-up?')) {
      await db.updateFollowup(fupId, { status: 'Skipped' });
      await loadData();
      if (activeFup?.id === fupId) {
        setActiveFup(null);
      }
    }
  };

  const handleCreateFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || generating) return;

    setGenerating(true);
    try {
      const res = await authFetch('/api/ai/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedLeadId, sequenceDay })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLeadId('');
        await loadData();
        alert('AI follow-up draft created and scheduled!');
      } else {
        alert(data.error || 'Failed to generate follow-up');
      }
    } catch (err) {
      console.warn('Failed to generate follow-up via AI:', err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <LoadingState message="LOADING FOLLOW-UP REMINDERS..." />;
  }

  const getLeadName = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.business_name : 'Unknown Target';
  };

  const pendingFups = followups.filter(f => f.status === 'Pending' || f.status === 'Drafted');
  const completedFups = followups.filter(f => f.status === 'Completed');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Left Column: Schedules */}
      <div className="lg:col-span-8 space-y-6">
        {/* Pending Follow-ups */}
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30">
          <div className="flex items-center space-x-2 text-neon-pink mb-4">
            <Calendar size={18} className="animate-pulse-glow" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
              Follow-up Schedule
            </h3>
          </div>

          {pendingFups.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-white/5 rounded-lg text-muted-foreground text-xs font-mono">
              NO PENDING FOLLOW-UP REMINDERS AT THIS TIME.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingFups.map((fup) => (
                <div key={fup.id} className="p-4 rounded-lg bg-white/2 border border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-neon-pink/20 transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-foreground">{getLeadName(fup.lead_id)}</span>
                      <span className="text-[10px] text-neon-pink bg-neon-pink/10 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                        {fup.followup_type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 select-text italic">
                      {fup.message ? `"${fup.message}"` : 'No draft content loaded.'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 whitespace-nowrap">
                    <span className="text-[10px] font-mono text-muted-foreground">DUE: {fup.followup_date}</span>
                    <button
                      onClick={() => setActiveFup(fup)}
                      className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/5 transition cursor-pointer"
                      title="Inspect copy"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => handleMarkCompleted(fup.id)}
                      className="p-1.5 rounded bg-neon-green/10 hover:bg-neon-green/20 text-neon-green border border-neon-green/20 transition cursor-pointer"
                      title="Mark Sent"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={() => handleSkip(fup.id)}
                      className="p-1.5 rounded bg-neon-pink/10 hover:bg-neon-pink/20 text-neon-pink border border-neon-pink/20 transition cursor-pointer"
                      title="Skip follow-up"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Follow-ups */}
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30">
          <div className="flex items-center space-x-2 text-neon-green mb-4">
            <Check size={18} />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
              Completed Follow-ups Log
            </h3>
          </div>

          {completedFups.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs font-mono">
              NO FOLLOW-UPS HAVE BEEN COMPLETED YET.
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {completedFups.map((fup) => (
                <div key={fup.id} className="p-3 bg-white/1 border border-white/3 rounded flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold block text-foreground">{getLeadName(fup.lead_id)}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Type: {fup.followup_type} | Sent due: {fup.followup_date}
                    </span>
                  </div>
                  <StatusBadge status={fup.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Draft Generator / Details */}
      <div className="lg:col-span-4 space-y-6">
        {/* Detail Panel */}
        {activeFup && (
          <div className="glass-panel p-6 border border-neon-pink/40 rounded-xl bg-neon-pink/5 neon-glow-pink">
            <div className="flex justify-between items-center mb-4">
              <span className="font-mono text-xs font-bold text-neon-pink uppercase">Review Follow-up Draft</span>
              <button
                onClick={() => setActiveFup(null)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-mono text-muted-foreground uppercase block">Client Name</span>
                <span className="text-xs font-bold text-foreground">{getLeadName(activeFup.lead_id)}</span>
              </div>

              <div>
                <span className="text-[9px] font-mono text-muted-foreground uppercase block">Follow-up Step</span>
                <span className="text-xs text-foreground font-mono">{activeFup.followup_type}</span>
              </div>

              {activeFup.message && (
                <div>
                  <span className="text-[9px] font-mono text-muted-foreground uppercase block mb-1">Message Text</span>
                  <div className="p-3 bg-cyber-bg border border-white/10 rounded text-xs leading-relaxed text-foreground select-text font-sans whitespace-pre-wrap">
                    {activeFup.message}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => handleMarkCompleted(activeFup.id)}
                  className="flex-1 py-2 bg-neon-green hover:bg-neon-green/80 text-white rounded font-mono font-bold text-[10px] uppercase transition cursor-pointer"
                >
                  Mark as Sent
                </button>
                <button
                  onClick={() => handleSkip(activeFup.id)}
                  className="px-4 py-2 border border-neon-pink/30 hover:bg-neon-pink/10 text-neon-pink rounded font-mono font-bold text-[10px] uppercase transition cursor-pointer"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generate draft form */}
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30">
          <div className="flex items-center space-x-2 text-neon-pink mb-4">
            <RefreshCw size={18} />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
              Create Follow-up Draft
            </h3>
          </div>

          <form onSubmit={handleCreateFollowup} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Select Potential Client (Lead)</label>
              <select
                required
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-pink transition"
              >
                <option value="">Select a prospect...</option>
                {leads.filter(l => ['Contacted', 'Replied', 'Call Booked', 'Proposal Sent'].includes(l.status)).map(l => (
                  <option key={l.id} value={l.id}>{l.business_name} ({l.status})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Select Follow-up Day</label>
              <select
                value={sequenceDay}
                onChange={(e) => setSequenceDay(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-pink transition"
              >
                <option value={3}>Day 3: Friendly check-in</option>
                <option value={7}>Day 7: Share helpful ideas</option>
                <option value={14}>Day 14: Final check-in</option>
                <option value={30}>Day 30: Re-engage inactive client</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={generating || !selectedLeadId}
              className="w-full py-2 bg-neon-pink hover:bg-neon-pink/80 text-white rounded font-mono font-bold text-xs tracking-wider transition uppercase cursor-pointer disabled:opacity-50 animate-pulse-glow"
            >
              {generating ? 'WRITING DRAFT...' : 'CREATE DRAFT WITH AI'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
