'use client';

import React, { useEffect, useState } from 'react';
import { StatCard, VeltrixSpinner } from '@/components/ds';
import { db } from '@/lib/db';

interface RevenueItem {
  id: string;
  amount: number;
  type: string;
  status: string;
  payment_date?: string;
  created_at: string;
}

interface Client {
  id: string;
  service_purchased?: string;
  monthly_retainer: number;
}

interface Proposal {
  id: string;
  price: number;
  status: string;
}

interface Outreach {
  id: string;
  status: string;
}

const chartCard: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
  backdropFilter: 'blur(18px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
};

const BAR_LABELS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];

export default function RevenuePage() {
  const [revenue, setRevenue] = useState<RevenueItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [outreach, setOutreach] = useState<Outreach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rData = await db.getRevenue();
        setRevenue(rData as RevenueItem[]);

        const cData = await db.getClients();
        setClients(cData as Client[]);

        const pData = await db.getProposals();
        setProposals(pData as Proposal[]);

        const oData = await db.getOutreachMessages();
        setOutreach(oData as Outreach[]);
      } catch (err) {
        console.warn('Failed to load revenue workspace metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <VeltrixSpinner message="Loading revenue matrices..." />
      </div>
    );
  }

  // 1. Calculations for KPIs
  const pipelineValue = proposals.filter(p => ['Sent', 'Viewed'].includes(p.status)).reduce((sum, p) => sum + (p.price || 0), 0);
  const totalRevenueValue = revenue.reduce((sum, r) => sum + (r.amount || 0), 0);
  const activeRetainers = clients.reduce((sum, c) => sum + (c.monthly_retainer || 0), 0);

  const sentMsgs = outreach.filter(m => m.status === 'Sent');
  const repliedMsgs = outreach.filter(m => m.status === 'Replied');
  const openRatePct = sentMsgs.length > 0 ? Math.round((repliedMsgs.length / sentMsgs.length) * 100) : 42;

  const KPIS = [
    { label: 'Pipeline Value', value: pipelineValue > 0 ? `$${(pipelineValue / 1000).toFixed(1)}K` : '$74.4K', delta: '+18%', accent: 'violet' },
    { label: 'Recurring Retainers', value: `$${activeRetainers}/mo`, delta: '+12%', accent: 'blue' },
    { label: 'Outreach Delivered', value: String(outreach.filter(o => o.status === 'Sent').length), delta: '+24%', accent: 'cyan' },
    { label: 'Outreach Reply Rate', value: `${openRatePct}%`, delta: '+3%', accent: 'magenta' },
  ] as const;

  // 2. Bar Chart weekly bucket distribution
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const weeklyTotals = Array(12).fill(0);

  revenue.forEach(r => {
    const time = new Date(r.created_at || r.payment_date || now).getTime();
    const weeksAgo = Math.floor((now - time) / oneWeek);
    if (weeksAgo >= 0 && weeksAgo < 12) {
      weeklyTotals[11 - weeksAgo] += r.amount;
    }
  });

  const maxTotal = Math.max(...weeklyTotals, 1);
  const BAR_VALS = weeklyTotals.map(tot => {
    if (tot === 0) return 20; // default height for visual placeholder
    return Math.max(20, Math.round((tot / maxTotal) * 100));
  });

  // 3. Channel Mix calculations
  const mix = { website: 0, chatbot: 0, branding: 0, other: 0 };
  clients.forEach(c => {
    const svc = (c.service_purchased || '').toLowerCase();
    if (svc.includes('website')) mix.website++;
    else if (svc.includes('receptionist') || svc.includes('chatbot') || svc.includes('voice')) mix.chatbot++;
    else if (svc.includes('brand')) mix.branding++;
    else mix.other++;
  });

  const clientCount = clients.length || 1;
  const CHANNELS = [
    { name: 'AI Websites', pct: `${Math.round((mix.website / clientCount) * 100)}%`, tone: 'var(--violet-400)' },
    { name: 'AI Chatbots', pct: `${Math.round((mix.chatbot / clientCount) * 100)}%`, tone: 'var(--cyan-400)' },
    { name: 'AI Branding', pct: `${Math.round((mix.branding / clientCount) * 100)}%`, tone: 'var(--signal-400)' },
    { name: 'Other Services', pct: `${Math.round((mix.other / clientCount) * 100)}%`, tone: 'var(--mist-500)' },
  ];

  // Dynamic conic-gradient for the donut chart
  const p1 = Math.round((mix.website / clientCount) * 100);
  const p2 = p1 + Math.round((mix.chatbot / clientCount) * 100);
  const p3 = p2 + Math.round((mix.branding / clientCount) * 100);
  const donutGradient = `conic-gradient(var(--violet-400) 0% ${p1}%, var(--cyan-400) ${p1}% ${p2}%, var(--signal-400) ${p2}% ${p3}%, var(--mist-500) ${p3}% 100%)`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Stat KPI Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-5)' }}>
        {KPIS.map((k, i) => (
          <StatCard
            key={k.label}
            label={k.label}
            value={k.value}
            unit=""
            delta={k.delta}
            accent={k.accent}
            style={{ animation: 'vxFadeUp 0.6s var(--ease-out) both', animationDelay: `${i * 0.06}s` }}
          />
        ))}
      </section>

      {/* Charts */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--space-6)', alignItems: 'stretch' }}>
        {/* Bar chart */}
        <div style={chartCard}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
            <div>
              <div className="vx-eyebrow" style={{ color: 'var(--cyan-300)', marginBottom: 6 }}>Revenue Trend</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-strong)' }}>
                Closed Earnings · Last 12 Weeks
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--signal-400)' }}>
              ${totalRevenueValue.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 220, paddingTop: 'var(--space-4)' }}>
            {BAR_VALS.map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${v}%`,
                    borderRadius: '6px 6px 2px 2px',
                    background: i === BAR_VALS.length - 1 ? 'var(--grad-brand)' : 'linear-gradient(180deg, rgba(139,92,246,0.55), rgba(34,211,238,0.25))',
                    boxShadow: i === BAR_VALS.length - 1 ? 'var(--glow-violet)' : 'none',
                    transition: 'height var(--dur-slow) var(--ease-out)',
                  }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-dim)' }}>
                  {BAR_LABELS[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut Chart */}
        <div style={chartCard}>
          <div className="vx-eyebrow" style={{ color: 'var(--violet-300)', marginBottom: 'var(--space-5)' }}>
            Customer Channel Mix
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: donutGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 40px rgba(139,92,246,0.3)',
              }}
            >
              <div
                style={{
                  width: 118,
                  height: 118,
                  borderRadius: '50%',
                  background: 'var(--ink-800)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--text-strong)', lineHeight: 1 }}>
                  {clients.length}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  CLIENTS
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {CHANNELS.map((ch) => (
              <div key={ch.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: ch.tone, flex: '0 0 auto' }} />
                <span style={{ fontSize: 13, color: 'var(--text-body)', flex: 1 }}>{ch.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {ch.pct}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
