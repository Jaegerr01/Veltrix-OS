'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { OutreachMessage, Lead } from '@/lib/types';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import ApprovalBadge from '@/components/ApprovalBadge';
import StatusBadge from '@/components/StatusBadge';
import { Send, Eye, Check, X, Mail, Linkedin, Instagram, RefreshCcw } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

export default function OutreachCenter() {
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states to generate message
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedOffer, setSelectedOffer] = useState('AI Receptionist / Lead Booking Agent');
  const [selectedChannel, setSelectedChannel] = useState<'Email' | 'LinkedIn' | 'Instagram'>('Email');
  const [generating, setGenerating] = useState(false);

  // View state
  const [activeMessage, setActiveMessage] = useState<OutreachMessage | null>(null);

  async function loadData() {
    try {
      const msgs = await db.getOutreachMessages();
      const lds = await db.getLeads();
      setMessages(msgs);
      setLeads(lds);
    } catch (e) {
      console.warn('Failed to load outreach messages or leads data:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveAndSend = async (msgId: string) => {
    try {
      const res = await authFetch('/api/outreach/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to send message.');
        return;
      }

      await loadData();
      if (activeMessage?.id === msgId) setActiveMessage(null);

      const notice = data.emailDelivered
        ? `Email dispatched! ${data.note}`
        : `Marked as Sent. ${data.note}`;
      alert(notice);
    } catch (err) {
      console.warn('Failed to approve and send outreach message:', err);
    }
  };

  const handleReject = async (msgId: string) => {
    if (confirm('Reject this outreach draft?')) {
      await db.updateOutreachMessage(msgId, {
        approval_status: 'Rejected',
        status: 'Failed'
      });
      await loadData();
      if (activeMessage?.id === msgId) {
        setActiveMessage(null);
      }
    }
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || generating) return;

    setGenerating(true);
    try {
      const res = await authFetch('/api/ai/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId,
          offerName: selectedOffer,
          channel: selectedChannel
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLeadId('');
        await loadData();
        alert('AI draft created! Check the Outbox to review it.');
      } else {
        alert(data.error || 'Failed to generate outreach');
      }
    } catch (err) {
      console.warn('Failed to generate outreach message draft:', err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <LoadingState message="LOADING MESSAGES OUTBOX..." />;
  }

  const getLeadName = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.business_name : 'Unknown Target';
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'LinkedIn': return <Linkedin size={14} className="text-[#0a66c2]" />;
      case 'Instagram': return <Instagram size={14} className="text-[#e1306c]" />;
      case 'Email':
      default:
        return <Mail size={14} className="text-neon-cyan" />;
    }
  };

  const pendingMessages = messages.filter(m => m.status === 'Draft');
  const sentMessages = messages.filter(m => m.status === 'Sent');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Left Columns: Messages Dashboard */}
      <div className="lg:col-span-8 space-y-6">
        {/* Pending approvals tab */}
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30">
          <div className="flex items-center space-x-2 text-neon-purple mb-4">
            <Send size={18} className="animate-pulse-glow" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
              Messages Outbox (Safety Gate)
            </h3>
          </div>

          {pendingMessages.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-white/5 rounded-lg text-muted-foreground text-xs font-mono">
              NO MESSAGES PENDING APPROVAL. YOU ARE ALL CAUGHT UP!
            </div>
          ) : (
            <div className="space-y-4">
              {pendingMessages.map((msg) => (
                <div key={msg.id} className="p-4 rounded-lg bg-white/2 border border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-neon-purple/20 transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {getChannelIcon(msg.channel)}
                      <span className="font-bold text-xs text-foreground">{getLeadName(msg.lead_id)}</span>
                      <span className="text-[9px] font-mono text-muted-foreground">({msg.channel})</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 select-text italic">
                      "{msg.message}"
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 whitespace-nowrap">
                    <ApprovalBadge status={msg.approval_status} />
                    <button
                      onClick={() => setActiveMessage(msg)}
                      className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/5 transition cursor-pointer"
                      title="Inspect copy"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => handleApproveAndSend(msg.id)}
                      className="p-1.5 rounded bg-neon-green/10 hover:bg-neon-green/20 text-neon-green border border-neon-green/20 transition cursor-pointer"
                      title="Approve & Send"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={() => handleReject(msg.id)}
                      className="p-1.5 rounded bg-neon-pink/10 hover:bg-neon-pink/20 text-neon-pink border border-neon-pink/20 transition cursor-pointer"
                      title="Reject draft"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dispatch Log tab */}
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30">
          <div className="flex items-center space-x-2 text-neon-green mb-4">
            <Mail size={18} />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
              Sent Messages Log
            </h3>
          </div>

          {sentMessages.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs font-mono">
              NO MESSAGES SENT YET.
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {sentMessages.map((msg) => (
                <div key={msg.id} className="p-3 bg-white/1 border border-white/3 rounded flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold block text-foreground">{getLeadName(msg.lead_id)}</span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-lg select-text">
                      Channel: {msg.channel} | Sent: {msg.sent_at ? new Date(msg.sent_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <StatusBadge status={msg.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Draft Form / Inspection Drawer */}
      <div className="lg:col-span-4 space-y-6">
        {/* Inspection Drawer */}
        {activeMessage && (
          <div className="glass-panel p-6 border border-neon-purple/40 rounded-xl bg-neon-purple/5 neon-glow-purple">
            <div className="flex justify-between items-center mb-4">
              <span className="font-mono text-xs font-bold text-neon-purple uppercase">Review Message Draft</span>
              <button
                onClick={() => setActiveMessage(null)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-mono text-muted-foreground uppercase block">Client Name</span>
                <span className="text-xs font-bold text-foreground">{getLeadName(activeMessage.lead_id)}</span>
              </div>

              <div>
                <span className="text-[9px] font-mono text-muted-foreground uppercase block">How to Send</span>
                <span className="text-xs text-foreground font-mono flex items-center space-x-1">
                  {getChannelIcon(activeMessage.channel)}
                  <span className="uppercase">{activeMessage.channel}</span>
                </span>
              </div>

              <div>
                <span className="text-[9px] font-mono text-muted-foreground uppercase block mb-1">Email / Message Text</span>
                <div className="p-3 bg-cyber-bg border border-white/10 rounded text-xs leading-relaxed text-foreground select-text font-sans whitespace-pre-wrap">
                  {activeMessage.message}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => handleApproveAndSend(activeMessage.id)}
                  className="flex-1 py-2 bg-neon-green hover:bg-neon-green/80 text-white rounded font-mono font-bold text-[10px] uppercase transition cursor-pointer"
                >
                  Approve & Send
                </button>
                <button
                  onClick={() => handleReject(activeMessage.id)}
                  className="px-4 py-2 border border-neon-pink/30 hover:bg-neon-pink/10 text-neon-pink rounded font-mono font-bold text-[10px] uppercase transition cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generate draft form */}
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30">
          <div className="flex items-center space-x-2 text-neon-cyan mb-4">
            <RefreshCcw size={18} />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
              Write a Message using AI
            </h3>
          </div>

          <form onSubmit={handleCreateDraft} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Select Potential Client (Lead)</label>
              <select
                required
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              >
                <option value="">Choose a prospect...</option>
                {leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').map(l => (
                  <option key={l.id} value={l.id}>{l.business_name} (Score: {l.lead_score})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Veltrix Service to Offer</label>
              <select
                value={selectedOffer}
                onChange={(e) => setSelectedOffer(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              >
                <option value="AI Website + Brand System">AI Website + Brand System ($1,200)</option>
                <option value="AI Receptionist / Lead Booking Agent">AI Receptionist ($1,000 + MRR)</option>
                <option value="Creative Tech Growth Package">Growth Package ($2,000)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Message Type / Channel</label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              >
                <option value="Email">Email Outbox</option>
                <option value="LinkedIn">LinkedIn DM</option>
                <option value="Instagram">Instagram Page Message</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={generating || !selectedLeadId}
              className="w-full py-2 bg-neon-cyan hover:bg-neon-cyan/80 text-black rounded font-mono font-bold text-xs tracking-wider transition uppercase cursor-pointer disabled:opacity-50"
            >
              {generating ? 'WRITING DRAFT...' : 'CREATE DRAFT WITH AI'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
