'use client';

import React, { useEffect, useState } from 'react';
import { PageHeaderCard, VxIcon, VeltrixSpinner } from '@/components/ds';
import { db } from '@/lib/db';

interface DailyReport {
  id: string;
  report_date: string;
  revenue_target: number;
  closed_revenue: number;
  pipeline_value: number;
  revenue_gap: number;
  top_priority?: string;
  leads_to_contact?: any;
  followups_due?: any;
  content_to_post?: string;
  recommended_action?: string;
  created_at: string;
}

const cmdCard: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
};

const block: React.CSSProperties = {
  padding: 'var(--space-5)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--ink-700)',
  border: '1px solid var(--hairline)',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);

  const fetchReports = async () => {
    try {
      const data = await db.getDailyReports();
      setReports(data as DailyReport[]);
    } catch (err) {
      console.warn('Failed to load reports from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCompileBrief = async () => {
    setCompiling(true);
    try {
      // Pull real stats to make the report functional and accurate
      const leads = await db.getLeads();
      const revenue = await db.getRevenue();
      const followups = await db.getFollowups();
      const proposals = await db.getProposals();

      const closedRevenue = revenue.reduce((sum, r) => sum + (r.amount || 0), 0);
      const pipelineValue = proposals.filter(p => ['Sent', 'Viewed'].includes(p.status)).reduce((sum, p) => sum + (p.price || 0), 0);
      const target = 6000;
      const gap = Math.max(0, target - closedRevenue);

      const newLeads = leads.filter(l => l.status === 'New').slice(0, 3).map(l => l.business_name);
      const pendingFollows = followups.filter(f => f.status === 'Pending').slice(0, 3).map(f => f.followup_type);

      await db.addDailyReport({
        report_date: new Date().toISOString().split('T')[0],
        revenue_target: target,
        closed_revenue: closedRevenue,
        pipeline_value: pipelineValue,
        revenue_gap: gap,
        top_priority: newLeads.length > 0 ? `Outreach to ${newLeads[0]} and other prospects.` : 'Index Obsidian brain for new strategy signals.',
        leads_to_contact: newLeads,
        followups_due: pendingFollows,
        content_to_post: 'Compose post: "Why local practices are bleeding customers by neglecting automated booking receptionists."',
        recommended_action: newLeads.length > 0 ? 'Draft customized outreach messaging for your newly scraped leads.' : 'Activate Maps Scraper to index local prospects.',
      });

      await fetchReports();
    } catch (err) {
      console.warn('Failed to compile report brief:', err);
    } finally {
      setCompiling(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', options);
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <VeltrixSpinner message="Accessing report vaults..." />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <PageHeaderCard
        icon="chartbar"
        title="Command Reports"
        subtitle="Historical daily command briefs — evaluating business target target postures, closed deals, and recommended actions."
        stats={[
          { value: String(reports.length), label: 'REPORTS GENERATED', color: 'var(--text-strong)' },
        ]}
        action={
          <button
            onClick={handleCompileBrief}
            disabled={compiling}
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
              border: 'none',
              boxShadow: 'var(--glow-violet)',
              whiteSpace: 'nowrap',
              opacity: compiling ? 0.6 : 1,
            }}
          >
            {compiling ? (
              <>
                <VxIcon name="refresh" size={14} style={{ animation: 'vxRingSpin 2s linear infinite' }} />
                Compiling...
              </>
            ) : (
              <>
                <VxIcon name="plus" size={14} />
                Compile Today&apos;s Brief
              </>
            )}
          </button>
        }
      />

      {reports.length > 0 ? (
        reports.map((rep) => (
          <section key={rep.id} className="vx-glass" style={cmdCard}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--violet-300)', display: 'flex' }}>
                  <VxIcon name="chartbar" size={18} />
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--violet-200)', textTransform: 'uppercase' }}>
                  VELTRIX Daily Command Brief
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--violet-200)',
                  padding: '5px 14px',
                  borderRadius: 999,
                  background: 'rgba(139,92,246,0.12)',
                  border: '1px solid var(--border-default)',
                }}
              >
                {formatDate(rep.report_date)}
              </span>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              <div style={{ ...block, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: 'var(--ls-wide)', textTransform: 'uppercase' }}>
                  Revenue Target
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--text-strong)', marginTop: 8 }}>
                  ${(rep.revenue_target || 0).toLocaleString()}
                </div>
              </div>
              <div style={{ ...block, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: 'var(--ls-wide)', textTransform: 'uppercase' }}>
                  Closed Revenue
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--signal-400)', marginTop: 8 }}>
                  ${(rep.closed_revenue || 0).toLocaleString()}
                </div>
              </div>
              <div style={{ ...block, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: 'var(--ls-wide)', textTransform: 'uppercase' }}>
                  Pipeline Value
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--cyan-300)', marginTop: 8 }}>
                  ${(rep.pipeline_value || 0).toLocaleString()}
                </div>
              </div>
              <div style={{ ...block, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: 'var(--ls-wide)', textTransform: 'uppercase' }}>
                  Revenue Gap
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: rep.revenue_gap > 0 ? 'var(--danger-400)' : 'var(--signal-400)', marginTop: 8 }}>
                  ${(rep.revenue_gap || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Deep Context Blocks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div style={block}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 'var(--ls-wide)', color: 'var(--violet-300)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Today&apos;s Top Priority
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-strong)', lineHeight: 1.4 }}>
                  {rep.top_priority || 'No specific priority set.'}
                </div>
              </div>
              <div style={block}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 'var(--ls-wide)', color: 'var(--signal-400)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Recommended Action
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-strong)', lineHeight: 1.4 }}>
                  {rep.recommended_action || 'Review active CRM pipeline.'}
                </div>
              </div>
              <div style={block}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 'var(--ls-wide)', color: 'var(--cyan-300)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Leads to Contact
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-body)', fontFamily: 'var(--font-mono)', lineHeight: 1.4 }}>
                  {Array.isArray(rep.leads_to_contact) && rep.leads_to_contact.length > 0 ? (
                    <ul style={{ paddingLeft: 16, margin: 0, listStyleType: 'disc' }}>
                      {rep.leads_to_contact.map((l: string, idx: number) => (
                        <li key={idx}>{l}</li>
                      ))}
                    </ul>
                  ) : (
                    'No new prospects queued for outreach.'
                  )}
                </div>
              </div>
              <div style={block}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 'var(--ls-wide)', color: 'var(--danger-400)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Follow-ups Due
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-body)', fontFamily: 'var(--font-mono)', lineHeight: 1.4 }}>
                  {Array.isArray(rep.followups_due) && rep.followups_due.length > 0 ? (
                    <ul style={{ paddingLeft: 16, margin: 0, listStyleType: 'disc' }}>
                      {rep.followups_due.map((f: string, idx: number) => (
                        <li key={idx}>{f}</li>
                      ))}
                    </ul>
                  ) : (
                    'No pending follow-ups due today.'
                  )}
                </div>
              </div>
            </div>
          </section>
        ))
      ) : (
        <div style={{ textAlign: 'center', padding: 'var(--space-10) 0', color: 'var(--text-dim)', fontSize: 13.5, fontFamily: 'var(--font-mono)' }}>
          No reports generated yet. Click &quot;Compile Today&apos;s Brief&quot; above to synthesize workspace statistics.
        </div>
      )}
    </div>
  );
}
