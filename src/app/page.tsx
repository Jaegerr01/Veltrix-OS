'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { OrbitalCommand, VxIcon, VeltrixSpinner } from '@/components/ds';
import { db } from '@/lib/db';

const dashCard: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 28,
  background: 'rgba(20,13,44,0.2)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
};

const tileStyle: React.CSSProperties = {
  padding: 'var(--space-4)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--ink-700)',
  border: '1px solid var(--hairline)',
  textAlign: 'center',
};

const formatRevenue = (val: number) => {
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val}`;
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<any>(null);
  const [goals, setGoals] = React.useState<any[]>([]);
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [leads, setLeads] = React.useState<any[]>([]);
  const [revenue, setRevenue] = React.useState<any[]>([]);
  const [displayName, setDisplayName] = React.useState('Operator');
  
  const [goalDraft, setGoalDraft] = React.useState('');
  const [goalsLoading, setGoalsLoading] = React.useState(false);

  const loadDashboardData = async () => {
    try {
      const [profData, goalsData, tasksData, leadsData, revData] = await Promise.all([
        db.getBusinessProfile(),
        db.getGoals(),
        db.getTasks(),
        db.getLeads(),
        db.getRevenue()
      ]);

      setProfile(profData);
      setGoals(goalsData.filter((g: any) => g.status !== 'Abandoned'));
      setTasks(tasksData);
      setLeads(leadsData);
      setRevenue(revData);
    } catch (err) {
      console.warn('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadDashboardData();
    
    // Load display name from localStorage
    const savedName = localStorage.getItem('vx_display_name') || 'Operator';
    setDisplayName(savedName);
  }, []);

  const toggleAutopilot = async () => {
    if (!profile) return;
    const newAutopilot = !profile.autopilot;
    
    setProfile((p: any) => ({ ...p, autopilot: newAutopilot }));
    
    try {
      await db.updateBusinessProfile({ autopilot: newAutopilot });
      
      // Dispatch a custom event to notify Settings page if open
      window.dispatchEvent(new Event('vx_settings_updated'));
    } catch (err) {
      console.warn('Failed to update autopilot:', err);
      // rollback
      setProfile((p: any) => ({ ...p, autopilot: !newAutopilot }));
    }
  };

  const handleAddGoal = async () => {
    const t = goalDraft.trim();
    if (!t) return;
    setGoalsLoading(true);
    try {
      const newGoal = await db.addGoal({
        title: t,
        description: 'Goal added from command center dashboard.',
        status: 'Pending',
        priority: 'Medium'
      });
      setGoals((prev) => [newGoal, ...prev]);
      setGoalDraft('');
    } catch (err) {
      console.warn('Failed to add goal:', err);
    } finally {
      setGoalsLoading(false);
    }
  };

  const handleToggleGoal = async (goalId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, status: newStatus } : g));
    try {
      await db.updateGoal(goalId, { status: newStatus });
    } catch (err) {
      console.warn('Failed to update goal status:', err);
      // rollback
      setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, status: currentStatus } : g));
    }
  };

  const handleRemoveGoal = async (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    try {
      await db.updateGoal(goalId, { status: 'Abandoned' });
    } catch (err) {
      console.warn('Failed to abandon goal:', err);
      // reload
      const updatedGoals = await db.getGoals();
      setGoals(updatedGoals.filter((g: any) => g.status !== 'Abandoned'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <VeltrixSpinner message="Loading your pipeline, revenue and tasks…" />
      </div>
    );
  }

  // calculations
  const totalLeads = leads.length;
  const bookedLeads = leads.filter(l => l.status === 'Call Booked').length;
  const wonLeads = leads.filter(l => l.status === 'Won').length;

  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const approvalTasks = tasks.filter(t => t.status === 'Needs Approval').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');

  // lead funnel counts
  const newCount = leads.filter(l => ['New', 'Researched', 'Qualified'].includes(l.status)).length;
  const contactedCount = leads.filter(l => l.status === 'Contacted').length;
  const repliedCount = leads.filter(l => l.status === 'Replied').length;
  const bookedCount = leads.filter(l => l.status === 'Call Booked').length;
  const proposalCount = leads.filter(l => l.status === 'Proposal Sent').length;
  const wonCount = leads.filter(l => l.status === 'Won').length;

  const maxFunnel = Math.max(newCount, contactedCount, repliedCount, bookedCount, proposalCount, wonCount, 1);
  // Real data only (rule 5): a stage with zero leads renders as an empty
  // hairline, not an inflated 5% bar pretending there's something there.
  const funnelBars: [string, number, string, number][] = [
    ['New', (newCount / maxFunnel) * 100, 'var(--violet-400)', newCount],
    ['Contact', (contactedCount / maxFunnel) * 100, 'var(--violet-400)', contactedCount],
    ['Replied', (repliedCount / maxFunnel) * 100, 'var(--violet-400)', repliedCount],
    ['Booked', (bookedCount / maxFunnel) * 100, 'var(--cyan-400)', bookedCount],
    ['Proposal', (proposalCount / maxFunnel) * 100, 'var(--cyan-400)', proposalCount],
    ['Won', (wonCount / maxFunnel) * 100, 'var(--cyan-400)', wonCount],
  ];

  // revenue target dial
  const closedRevenue = profile?.current_monthly_revenue || 0;
  const targetRevenue = profile?.target_monthly_revenue || 6000;
  const targetPercent = Math.min(100, Math.round((closedRevenue / targetRevenue) * 100));

  const pipelineValue = revenue
    .filter((r) => ['Expected', 'Invoiced', 'Overdue'].includes(r.status))
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const revenueLegend = [
    { label: 'Goal', value: formatRevenue(targetRevenue), color: 'var(--mist-400)' },
    { label: 'Earned', value: formatRevenue(closedRevenue), color: 'var(--brand)' },
    { label: 'Pipeline', value: formatRevenue(pipelineValue), color: 'var(--cyan-400)' },
  ];

  const overviewTiles = [
    { value: String(totalLeads), label: 'LEADS', color: 'var(--cyan-300)' },
    { value: String(bookedLeads), label: 'BOOKED', color: 'var(--text-strong)' },
    { value: String(wonLeads), label: 'WON', color: 'var(--signal-400)' },
  ];

  const goalsDone = `${goals.filter((g) => g.status === 'Completed').length} / ${goals.length} done`;

  // Fake progress % (derived from title char codes) removed per design rule 5 —
  // never display invented data. Tasks show their real priority instead.
  const getTaskColor = (priority: string) => {
    if (priority === 'Critical') return 'var(--danger-400)';
    if (priority === 'High') return 'var(--warn-400)';
    if (priority === 'Medium') return 'var(--violet-300)';
    return 'var(--cyan-400)';
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    /* Spacing rhythm (rule 1): tight greeting→hero (space-6), the hero dominates,
       then a deliberate wide break (space-16) before the denser data sections,
       which sit closer together (space-8). Not one even column. */
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Greeting + autopilot */}
      <section style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-strong)' }}>
            Good morning, {displayName}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
            {formattedDate} · ${closedRevenue.toLocaleString()} closed of ${targetRevenue.toLocaleString()} target
          </div>
        </div>
        <div
          onClick={toggleAutopilot}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 9,
            padding: '9px 16px',
            borderRadius: 999,
            cursor: 'pointer',
            background: profile?.autopilot ? 'rgba(46,230,160,0.12)' : 'rgba(255,255,255,0.03)',
            border: profile?.autopilot ? '1px solid rgba(46,230,160,0.35)' : '1px solid var(--border-default)',
            boxShadow: profile?.autopilot ? '0 0 18px rgba(46,230,160,0.3)' : 'none',
            transition: 'all var(--dur-base) var(--ease-out)',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: profile?.autopilot ? 'var(--signal-400)' : 'var(--mist-400)',
              /* Static glow — color carries the state, no blinking (rule 6) */
              boxShadow: profile?.autopilot ? '0 0 8px var(--signal-400)' : 'none',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 'var(--ls-wide)',
              textTransform: 'uppercase',
              color: profile?.autopilot ? 'var(--signal-400)' : 'var(--text-muted)',
            }}
          >
            {profile?.autopilot ? 'Autopilot Active' : 'Autopilot Standby'}
          </span>
        </div>
      </section>

      {/* Orbital hero — the one big open moment on the page */}
      <div style={{ marginBottom: 'var(--space-16)' }}>
        <OrbitalCommand />
      </div>

      {/* Overview / Funnel / Revenue — dense detail band */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr', gap: 'var(--space-6)', alignItems: 'stretch', marginBottom: 'var(--space-8)' }}>
        {/* Business Overview */}
        <div className="vx-glass" style={dashCard}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div className="vx-eyebrow" style={{ color: 'var(--text-muted)' }}>This month</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-strong)', marginTop: 4 }}>Business Overview</div>
            </div>
            <span
              style={{
                width: 34,
                height: 34,
                flex: '0 0 auto',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--violet-200)',
                background: 'rgba(139,92,246,0.14)',
                border: '1px solid var(--border-default)',
              }}
            >
              <VxIcon name="sparkle" size={18} />
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 700, lineHeight: 1, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>{completedTasks}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Tasks completed</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 700, lineHeight: 1, color: 'var(--violet-300)', letterSpacing: '-0.02em' }}>{approvalTasks}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Need approval</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            {overviewTiles.map((t) => (
              <div key={t.label} style={tileStyle}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: t.color, lineHeight: 1 }}>{t.value}</div>
                <div style={{ fontSize: 9.5, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: 'var(--ls-wide)', marginTop: 8 }}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Funnel */}
        <div className="vx-glass" style={dashCard}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div className="vx-eyebrow" style={{ color: 'var(--text-muted)' }}>Pipeline</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-strong)', marginTop: 4 }}>Lead Funnel</div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--violet-400)' }} />Leads
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan-400)' }} />Won
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, marginTop: 'var(--space-6)' }}>
            {funnelBars.map(([label, h, c, count]) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                {count > 0 ? (
                  <div style={{ width: '100%', height: `${Math.max(6, h)}%`, borderRadius: '6px 6px 2px 2px', background: `linear-gradient(180deg, ${c}, rgba(139,92,246,0.15))`, boxShadow: `0 0 12px ${c}44` }} />
                ) : (
                  <div style={{ width: '100%', height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }} />
                )}
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-5)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--hairline)' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: 'var(--ls-wide)' }}>PIPELINE VALUE</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--cyan-300)', marginTop: 4 }}>${pipelineValue.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: 'var(--ls-wide)' }}>TOTAL LEADS</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-strong)', marginTop: 4 }}>{totalLeads}</div>
            </div>
          </div>
        </div>

        {/* Revenue Target */}
        <div className="vx-glass" style={dashCard}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div className="vx-eyebrow" style={{ color: 'var(--text-muted)' }}>Monthly Goal</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-strong)', marginTop: 4 }}>Revenue Target</div>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: 'var(--ls-wide)',
                textTransform: 'uppercase',
                color: targetPercent >= 100 ? 'var(--signal-400)' : 'var(--warn-400)',
                padding: '5px 12px',
                borderRadius: 999,
                background: targetPercent >= 100 ? 'rgba(46,230,160,0.1)' : 'rgba(245,158,11,0.10)',
                border: targetPercent >= 100 ? '1px solid rgba(46,230,160,0.3)' : '1px solid rgba(245,158,11,0.3)',
              }}
            >
              {targetPercent >= 100 ? 'On Track' : 'Behind'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', marginTop: 'var(--space-6)' }}>
            <div
              style={{
                width: 120,
                height: 120,
                flex: '0 0 auto',
                borderRadius: '50%',
                background: `conic-gradient(var(--brand) 0% ${targetPercent}%, rgba(255,255,255,0.06) ${targetPercent}% 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--glow-violet)',
              }}
            >
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--ink-800)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-strong)', lineHeight: 1 }}>{targetPercent}%</span>
                <span style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}>of goal</span>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {revenueLegend.map((r) => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, flex: '0 0 auto', background: r.color }} />
                  <span style={{ fontSize: 13, color: 'var(--text-body)', flex: 1 }}>{r.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-strong)' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            onClick={() => router.push('/revenue')}
            style={{
              marginTop: 'var(--space-6)',
              padding: '11px 0',
              textAlign: 'center',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-body)',
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--dur-base) var(--ease-out)',
            }}
          >
            View Reports →
          </div>
        </div>
      </section>

      {/* Goals + Tasks in progress */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', alignItems: 'stretch' }}>
        {/* Today's Goals */}
        <div className="vx-glass" style={dashCard}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
            <div>
              <div className="vx-eyebrow" style={{ color: 'var(--text-muted)' }}>Priorities</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-strong)', marginTop: 4 }}>Today&apos;s Goals</div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>{goalsDone}</span>
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <input
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddGoal();
              }}
              placeholder="Add a goal for today…"
              style={{
                flex: 1,
                minWidth: 0,
                height: 40,
                padding: '0 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--ink-700)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-strong)',
                fontFamily: 'var(--font-body)',
                fontSize: 13.5,
                outline: 'none',
              }}
            />
            <button
              onClick={handleAddGoal}
              disabled={goalsLoading || !goalDraft.trim()}
              style={{
                width: 40,
                height: 40,
                flex: '0 0 auto',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                background: 'var(--grad-brand)',
                boxShadow: 'var(--glow-violet)',
                cursor: 'pointer',
                border: 'none',
                opacity: goalsLoading || !goalDraft.trim() ? 0.5 : 1
              }}
            >
              <VxIcon name="plus" size={16} color="#fff" />
            </button>
          </div>

          {goals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '280px', overflowY: 'auto' }}>
              {goals.map((g, i) => {
                const isCompleted = g.status === 'Completed';
                return (
                  <div
                    key={g.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < goals.length - 1 ? '1px solid var(--hairline)' : 'none' }}
                  >
                    <span
                      onClick={() => handleToggleGoal(g.id, g.status)}
                      style={{
                        width: 20,
                        height: 20,
                        flex: '0 0 auto',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        background: isCompleted ? 'var(--grad-brand)' : 'transparent',
                        border: isCompleted ? '1px solid transparent' : '1px solid var(--border-default)',
                        boxShadow: isCompleted ? 'var(--glow-violet)' : 'none',
                      }}
                    >
                      {isCompleted ? <VxIcon name="check" size={12} color="#fff" /> : null}
                    </span>
                    <span style={{ flex: 1, fontSize: 13.5, color: isCompleted ? 'var(--text-dim)' : 'var(--text-body)', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                      {g.title}
                    </span>
                    <span 
                      onClick={() => handleRemoveGoal(g.id)} 
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--text-dim)', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
                      title="Archive Goal"
                    >
                      ×
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--text-dim)', fontSize: 13.5 }}>No active goals for today — add a priority above.</div>
          )}
        </div>

        {/* Tasks In Progress */}
        <div className="vx-glass" style={dashCard}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
            <div>
              <div className="vx-eyebrow" style={{ color: 'var(--text-muted)' }}>Action Queue</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>Tasks In Progress</span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--violet-200)',
                    padding: '2px 9px',
                    borderRadius: 999,
                    background: 'rgba(139,92,246,0.14)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  {inProgressTasks.length}
                </span>
              </div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => router.push('/tasks')}>All tasks →</span>
          </div>

          {inProgressTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxHeight: '330px', overflowY: 'auto' }}>
              {inProgressTasks.map((tk) => {
                const taskColor = getTaskColor(tk.priority);
                return (
                  <div
                    key={tk.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--ink-700)', border: '1px solid var(--hairline)' }}
                  >
                    <span style={{ width: 8, height: 8, flex: '0 0 auto', borderRadius: '50%', background: taskColor, boxShadow: `0 0 8px ${taskColor}` }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)' }}>{tk.title}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{tk.agent_name || 'System Agent'}</div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: taskColor }}>{tk.priority}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--text-dim)', fontSize: 13.5 }}>
              No tasks currently in progress by autonomous agents.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
