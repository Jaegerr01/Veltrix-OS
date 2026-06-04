'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
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

  async function loadData() {
    try {
      const bp = await db.getBusinessProfile();
      const revs = await db.getRevenue();
      const clts = await db.getClients();
      setProfile(bp);
      setRevenues(revs);
      setClients(clts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

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
      console.error(err);
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
