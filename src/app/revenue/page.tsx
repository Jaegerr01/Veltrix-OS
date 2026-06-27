'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { useRealtime } from '@/hooks/useRealtime';
import { Revenue, BusinessProfile, Client } from '@/lib/types';
import LoadingState from '@/components/LoadingState';
import StatusBadge from '@/components/StatusBadge';
import { DollarSign, Landmark, ArrowUpRight, TrendingDown, ClipboardList } from 'lucide-react';

export default function RevenueTracker() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [amount, setAmount] = useState('');
  const [clientId, setClientId] = useState('');
  const [revType, setRevType] = useState<any>('Project');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Marcus Simulator state
  const [websitesToClose, setWebsitesToClose] = useState(0);
  const [receptionistsToClose, setReceptionistsToClose] = useState(0);
  const [playbookResult, setPlaybookResult] = useState('');
  const [generatingPlaybook, setGeneratingPlaybook] = useState(false);

  async function loadData() {
    try {
      const bp = await db.getBusinessProfile();
      const revs = await db.getRevenue();
      const clts = await db.getClients();
      setProfile(bp);
      setRevenues(revs);
      setClients(clts);
    } catch (e) {
      console.warn('Failed to load revenue data:', e);
    } finally {
      setLoading(false);
    }
  }

  useRealtime('profiles', loadData);
  useRealtime('revenue', loadData);
  useRealtime('clients', loadData);

  useEffect(() => {
    loadData();
  }, []);

  const handleAddRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || submitting) return;

    setSubmitting(true);
    try {
      const selectedClient = clients.find(c => c.id === clientId);
      const today = new Date();
      
      await db.addRevenue({
        client_id: clientId || undefined,
        amount: Number(amount),
        type: revType,
        status: 'Paid',
        payment_date: today.toISOString().split('T')[0],
        month: today.toISOString().substring(0, 7),
        notes: notes || (selectedClient ? `Payment from ${selectedClient.business_name}` : 'General revenue input')
      });

      // Reset form & reload
      setAmount('');
      setClientId('');
      setNotes('');
      await loadData();
      alert('Revenue successfully recorded!');
    } catch (err) {
      console.warn('Failed to record revenue:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="LOADING EARNINGS LOG..." />;
  }

  const closed = profile?.current_monthly_revenue || 0;
  const target = profile?.target_monthly_revenue || 6000;
  const gap = Math.max(0, target - closed);
  
  // Retainer sum
  const retainerMRR = clients.reduce((acc, c) => acc + (c.status === 'Active' ? Number(c.monthly_retainer) : 0), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 glass-panel border border-white/5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-muted-foreground uppercase block mb-1">Monthly Goal</span>
            <span className="text-xl font-bold font-mono text-foreground">${target.toLocaleString()}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-neon-purple/10 text-neon-purple">
            <Landmark size={20} />
          </div>
        </div>

        <div className="p-6 glass-panel border border-white/5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-muted-foreground uppercase block mb-1">Money Earned</span>
            <span className="text-xl font-bold font-mono text-neon-green">${closed.toLocaleString()}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-neon-green/10 text-neon-green">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="p-6 glass-panel border border-white/5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-muted-foreground uppercase block mb-1">Left to Go</span>
            <span className="text-xl font-bold font-mono text-neon-pink">${gap.toLocaleString()}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-neon-pink/10 text-neon-pink">
            <TrendingDown size={20} />
          </div>
        </div>

        <div className="p-6 glass-panel border border-white/5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-muted-foreground uppercase block mb-1">Monthly Retainers (Recurring)</span>
            <span className="text-xl font-bold font-mono text-neon-cyan">${retainerMRR.toLocaleString()}/mo</span>
          </div>
          <div className="p-2.5 rounded-lg bg-neon-cyan/10 text-neon-cyan">
            <ArrowUpRight size={20} />
          </div>
        </div>
      </div>

      {/* Marcus Revenue Forecasting Simulator */}
      <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <div className="flex items-center space-x-2 text-neon-cyan">
            <ClipboardList size={18} className="animate-pulse-glow" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">
              Marcus Simulator & Playbook
            </h3>
          </div>
          <span className="text-[10px] font-mono text-neon-cyan bg-neon-cyan/5 border border-neon-cyan/20 px-2.5 py-0.5 rounded-full font-bold">
            FINANCIAL ADVISOR ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Sliders */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">Simulator Inputs</span>
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>AI Website Refresh ($1,200/ea)</span>
                <span className="text-neon-cyan font-bold">{websitesToClose} Deals</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={websitesToClose}
                onChange={(e) => setWebsitesToClose(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>AI Receptionist Setup ($1,000 + $250 retainer)</span>
                <span className="text-neon-cyan font-bold">{receptionistsToClose} Deals</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={receptionistsToClose}
                onChange={(e) => setReceptionistsToClose(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
              />
            </div>
          </div>

          {/* Calculations */}
          <div className="p-4 rounded-lg bg-white/2 border border-white/5 space-y-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">Forecast Calculations</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <span className="text-muted-foreground">Closed Sales:</span>
              <span className="text-right text-foreground">${closed.toLocaleString()}</span>
              
              <span className="text-muted-foreground">Est. Setup Inflow:</span>
              <span className="text-right text-neon-green">+${(websitesToClose * 1200 + receptionistsToClose * 1000).toLocaleString()}</span>
              
              <span className="text-muted-foreground">New MRR Retainers:</span>
              <span className="text-right text-neon-cyan">+${(receptionistsToClose * 250).toLocaleString()}/mo</span>
            </div>

            <div className="border-t border-white/5 pt-2 flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-foreground">Projected Total:</span>
              <span className="text-sm font-mono font-bold text-neon-green">
                ${(closed + websitesToClose * 1200 + receptionistsToClose * 1000 + receptionistsToClose * 250).toLocaleString()}
              </span>
            </div>

            {closed + websitesToClose * 1200 + receptionistsToClose * 1000 + receptionistsToClose * 250 >= target ? (
              <div className="p-2 text-center bg-neon-green/10 border border-neon-green/30 text-neon-green rounded text-[10px] font-mono font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                ✓ GAP BRIDGED! Monthly revenue target achieved.
              </div>
            ) : (
              <div className="p-2 text-center bg-neon-pink/10 border border-neon-pink/30 text-neon-pink rounded text-[10px] font-mono font-bold">
                Gap remaining: ${(Math.max(0, target - (closed + websitesToClose * 1200 + receptionistsToClose * 1000 + receptionistsToClose * 250))).toLocaleString()}
              </div>
            )}
          </div>

          {/* Marcus Playbook */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">Marcus Playbook</span>
            <button
              onClick={async () => {
                setGeneratingPlaybook(true);
                try {
                  const res = await fetch('/api/ai/agent/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      agentKey: 'revenue',
                      params: { websites: websitesToClose, receptionists: receptionistsToClose }
                    })
                  });
                  const json = await res.json();
                  if (json.success && json.result) {
                    setPlaybookResult(json.result);
                  } else {
                    setPlaybookResult('Marcus (Revenue Agent): Focus on qualifying medical practices in the CRM. Pitch receptionist savings first.');
                  }
                } catch (err) {
                  setPlaybookResult('Marcus (Revenue Agent): Triggered strategy compilation fallback.');
                } finally {
                  setGeneratingPlaybook(false);
                }
              }}
              disabled={generatingPlaybook || (websitesToClose === 0 && receptionistsToClose === 0)}
              className="w-full py-2 bg-neon-cyan hover:bg-neon-cyan/80 text-black font-mono font-bold text-[10px] tracking-wider rounded transition cursor-pointer disabled:opacity-50"
            >
              {generatingPlaybook ? 'COMPILING STRATEGY...' : 'GENERATE CLOSE PLAYBOOK'}
            </button>

            <div className="h-28 overflow-y-auto p-3 rounded bg-black/45 border border-white/5 font-mono text-[9px] text-muted-foreground leading-relaxed">
              {playbookResult ? (
                <div className="whitespace-pre-wrap select-text">{playbookResult}</div>
              ) : (
                <span className="italic text-muted-foreground/50">[Select simulation deals and click Generate to see Marcus’s sales instructions...]</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Revenue Log */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            EARNINGS HISTORY
          </h3>

          <div className="overflow-x-auto glass-panel border border-white/5 rounded-xl bg-cyber-bg/20">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-cyber-border bg-white/5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Month / Date</th>
                  <th className="px-6 py-4 font-bold">Type of Sale</th>
                  <th className="px-6 py-4 font-bold">Details</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {revenues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground font-mono">
                      No earnings transactions recorded.
                    </td>
                  </tr>
                ) : (
                  revenues.map((rev) => (
                    <tr key={rev.id} className="hover:bg-white/2 transition">
                      <td className="px-6 py-4 font-mono">
                        <div>
                          <span className="font-semibold block">{rev.month}</span>
                          <span className="text-muted-foreground text-[10px] block mt-0.5">{rev.payment_date || 'Pending'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 font-mono text-[9px] text-neon-cyan">
                          {rev.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground max-w-xs truncate font-sans text-[11px] select-text">
                        {rev.notes}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={rev.status} />
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-neon-green text-sm">
                        +${rev.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Record Revenue Form */}
        <div className="lg:col-span-4">
          <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30">
            <div className="flex items-center space-x-2 text-neon-green mb-4">
              <Landmark size={18} />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
                Record a Sale
              </h3>
            </div>

            <form onSubmit={handleAddRevenue} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">
                  Select Client
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-neon-green transition"
                >
                  <option value="">General (No client selected)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.business_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">
                  Type of Payment
                </label>
                <select
                  value={revType}
                  onChange={(e) => setRevType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-neon-green transition"
                >
                  <option value="Setup Fee">Setup Fee</option>
                  <option value="Project">Project Delivery</option>
                  <option value="Retainer">Monthly Retainer</option>
                  <option value="Upsell">Upsell Feature</option>
                  <option value="Other">Other Revenue</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">
                  Amount Received (in Dollars)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1200"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-neon-green transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">
                  Details / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Website launch payment"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-neon-green transition"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !amount}
                className="w-full py-2 bg-neon-green hover:bg-neon-green/80 text-white rounded font-mono font-bold text-xs tracking-wider transition uppercase cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'SAVING...' : 'SAVE TRANSACTION'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
