'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Client } from '@/lib/types';
import ClientCard from '@/components/ClientCard';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import { Briefcase, Plus } from 'lucide-react';

export default function ClientsCenter() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [servicePurchased, setServicePurchased] = useState('AI Website + Brand System');
  const [totalValue, setTotalValue] = useState('');
  const [monthlyRetainer, setMonthlyRetainer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadClients() {
    try {
      const clts = await db.getClients();
      setClients(clts);
    } catch (e) {
      console.warn('Failed to load clients:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || submitting) return;

    setSubmitting(true);
    try {
      await db.addClient({
        business_name: businessName,
        contact_name: contactName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        website: website || undefined,
        service_purchased: servicePurchased,
        total_value: Number(totalValue) || 0,
        monthly_retainer: Number(monthlyRetainer) || 0,
        status: 'Active'
      });

      // Clear Form & Reload
      setBusinessName('');
      setContactName('');
      setEmail('');
      setPhone('');
      setWebsite('');
      setTotalValue('');
      setMonthlyRetainer('');
      setShowAddForm(false);
      await loadClients();
    } catch (err) {
      console.warn('Failed to save manual client:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="LOADING CLIENTS..." />;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Action Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 text-neon-cyan">
          <Briefcase size={20} />
          <span className="font-mono text-sm font-bold uppercase tracking-wider">My Clients</span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/85 text-black rounded text-xs font-mono font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
        >
          <Plus size={14} />
          <span>{showAddForm ? 'HIDE FORM' : 'ADD A CLIENT'}</span>
        </button>
      </div>

      {/* Add Client Form Panel */}
      {showAddForm && (
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30">
          <h4 className="text-sm font-mono font-bold text-neon-cyan uppercase mb-4">
            Add a New Client
          </h4>
          <form onSubmit={handleAddClient} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                placeholder="Radiant Smiles Clinic"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Contact Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                placeholder="Dr. John Doe"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Client Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                placeholder="contact@radiant.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                placeholder="555-1290"
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
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Service Package</label>
              <select
                value={servicePurchased}
                onChange={(e) => setServicePurchased(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              >
                <option value="AI Website + Brand System">AI Website + Brand System</option>
                <option value="AI Receptionist / Lead Booking Agent">AI Receptionist / Booking widget</option>
                <option value="Creative Tech Growth Package">Creative Tech Growth Package</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">One-Time Setup Fee (in Dollars)</label>
              <input
                type="number"
                placeholder="e.g. 1200"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Monthly Fee (in Dollars)</label>
              <input
                type="number"
                placeholder="e.g. 250 (recurring)"
                value={monthlyRetainer}
                onChange={(e) => setMonthlyRetainer(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              />
            </div>
            <div className="md:col-span-2 xl:col-span-3 flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-white/10 rounded text-muted-foreground hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/80 text-black rounded font-mono font-bold transition cursor-pointer"
              >
                {submitting ? 'SAVING...' : 'SAVE CLIENT'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of clients */}
      {clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Clients Added Yet"
          description="No active clients found. You can add a client manually using the button above."
          actionLabel="Add a Client"
          onAction={() => setShowAddForm(true)}
        />
      )}
    </div>
  );
}
