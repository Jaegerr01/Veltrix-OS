'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Badge, Button, EmptyState, Skeleton, Switch, VxIcon } from '@/components/ds';
import { db } from '@/lib/db';
import type { BusinessProfile, Goal, Lead, Revenue, Task } from '@/lib/types';
import { asErr } from '@/lib/errors';
import { useToast } from '@/components/Toast';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import StatusStrip from '@/components/StatusStrip';

// The orbital network is a heavy animated scene: load it after first paint, with a same-size placeholder (no layout shift).
const OrbitalCommand = dynamic(() => import('@/components/ds/OrbitalCommand'), {
  ssr: false,
  loading: () => <div className="vx-card vx-hero-slot" role="status" aria-label="Loading agent network"><Skeleton height="100%" style={{ minHeight: 380 }} /></div>,
});

const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const greeting = (d: Date) => (d.getHours() < 12 ? 'Good morning' : d.getHours() < 18 ? 'Good afternoon' : 'Good evening');
const PRIORITY_TONE: Record<string, string> = { Critical: 'danger', High: 'warning', Medium: 'neutral', Low: 'neutral' };

export default function DashboardPage() {
  const toast = useToast();
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [revenue, setRevenue] = React.useState<Revenue[]>([]);
  const [displayName, setDisplayName] = React.useState('Operator');
  const [goalDraft, setGoalDraft] = React.useState('');
  const [goalBusy, setGoalBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoadError(null);
    try {
      const [p, g, t, l, r] = await Promise.all([db.getBusinessProfile(), db.getGoals(), db.getTasks(), db.getLeads(), db.getRevenue()]);
      setProfile(p);
      setGoals(g.filter(x => x.status !== 'Abandoned'));
      setTasks(t); setLeads(l); setRevenue(r);
    } catch (e) {
      setLoadError(asErr(e).message || 'Could not load your workspace data.');
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => { void load(); setDisplayName(localStorage.getItem('vx_display_name') || 'Operator'); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const toggleAutopilot = async (next: boolean) => {
    if (!profile) return;
    setProfile({ ...profile, autopilot: next });
    try {
      await db.updateBusinessProfile({ autopilot: next });
      window.dispatchEvent(new Event('vx_settings_updated'));
      toast.success(next ? 'Autopilot is on' : 'Autopilot is on standby');
    } catch (e) {
      setProfile({ ...profile, autopilot: !next });
      toast.error('Could not change autopilot', asErr(e).message);
    }
  };

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = goalDraft.trim();
    if (!title || goalBusy) return;
    setGoalBusy(true);
    try {
      const g = await db.addGoal({ title, description: 'Added from the dashboard.', status: 'Pending', priority: 'Medium' });
      setGoals(prev => [g, ...prev]); setGoalDraft('');
    } catch (err) { toast.error('Could not add the goal', asErr(err).message); }
    finally { setGoalBusy(false); }
  };

  const toggleGoal = async (g: Goal) => {
    const next: Goal['status'] = g.status === 'Completed' ? 'Pending' : 'Completed';
    setGoals(prev => prev.map(x => (x.id === g.id ? { ...x, status: next } : x)));
    try { await db.updateGoal(g.id, { status: next }); }
    catch (err) { setGoals(prev => prev.map(x => (x.id === g.id ? { ...x, status: g.status } : x))); toast.error('Could not update the goal', asErr(err).message); }
  };

  const archiveGoal = async (g: Goal) => {
    setGoals(prev => prev.filter(x => x.id !== g.id));
    try {
      await db.updateGoal(g.id, { status: 'Abandoned' });
      toast.undoable(`Archived "${g.title}"`, async () => {
        await db.updateGoal(g.id, { status: g.status });
        setGoals(prev => [g, ...prev]);
      });
    } catch (err) { setGoals(prev => [g, ...prev]); toast.error('Could not archive the goal', asErr(err).message); }
  };

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const paidThisMonth = revenue.filter(r => r.status === 'Paid' && r.month === month).reduce((s, r) => s + Number(r.amount), 0);
  const pipelineValue = revenue.filter(r => ['Expected', 'Invoiced', 'Overdue'].includes(r.status)).reduce((s, r) => s + Number(r.amount), 0);
  const target = profile?.target_monthly_revenue || 0;
  const pct = target > 0 ? Math.min(100, Math.round((paidThisMonth / target) * 100)) : 0;
  const count = (...s: string[]) => leads.filter(l => s.includes(l.status)).length;
  const funnel: [string, number, boolean][] = [
    ['New', count('New', 'Researched', 'Qualified'), false], ['Contacted', count('Contacted'), false], ['Replied', count('Replied'), false],
    ['Booked', count('Call Booked'), true], ['Proposal', count('Proposal Sent'), true], ['Won', count('Won'), true],
  ];
  const maxF = Math.max(1, ...funnel.map(f => f[1]));
  const active = tasks.filter(t => t.status === 'In Progress' || t.status === 'Needs Approval').slice(0, 6);
  const goalsDone = goals.filter(g => g.status === 'Completed').length;

  if (loading) {
    return (
      <div className="vx-stack" role="status" aria-label="Loading dashboard">
        <Skeleton width={320} height={34} />
        <div className="vx-grid vx-grid--stats">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="vx-stat"><Skeleton width="50%" height={12} /><Skeleton width="35%" height={30} /></div>)}</div>
        <div className="vx-card vx-hero-slot"><Skeleton height="100%" style={{ minHeight: 380 }} /></div>
      </div>
    );
  }

  return (
    <div className="vx-stack" style={{ gap: 'var(--space-6)' }}>
      <header className="vx-pagehead">
        <div>
          <h2 className="vx-pagehead__title">{greeting(now)}, {displayName}</h2>
          <p className="vx-pagehead__sub">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {' - '}{money(paidThisMonth)} paid this month{target > 0 ? <> of {money(target)} target</> : <> (<Link href="/settings">set a monthly target</Link>)</>}
          </p>
        </div>
        {profile ? (
          <Switch checked={profile.autopilot} onChange={toggleAutopilot} label={profile.autopilot ? 'Autopilot on' : 'Autopilot standby'} />
        ) : null}
      </header>

      {loadError ? (
        <div className="vx-callout" data-tone="bad" role="alert">
          <VxIcon name="alert" size={18} />
          <div>
            <p className="vx-callout__title">Could not load some workspace data</p>
            <p className="vx-callout__body">{loadError}</p>
            <button type="button" className="vx-linkbtn" style={{ marginTop: 8 }} onClick={() => { setLoading(true); void load(); }}>Try again</button>
          </div>
        </div>
      ) : null}

      <OnboardingChecklist />
      <StatusStrip />

      <OrbitalCommand />

      <div className="vx-grid vx-grid--3">
        <section className="vx-card" aria-labelledby="d-overview">
          <div className="vx-card__head"><div><p className="vx-card__eyebrow">Agents</p><h2 className="vx-card__title" id="d-overview">Business overview</h2></div></div>
          <div className="vx-row" style={{ gap: 'var(--space-8)' }}>
            <div><div className="vx-stat__value">{tasks.filter(t => t.status === 'Completed').length}</div><div className="vx-stat__note">Tasks completed</div></div>
            <div><div className="vx-stat__value" style={{ color: 'var(--violet-300)' }}>{tasks.filter(t => t.status === 'Needs Approval').length}</div><div className="vx-stat__note">Need approval</div></div>
          </div>
          <dl className="vx-row" style={{ gap: 'var(--space-3)', marginTop: 'var(--space-6)', flexWrap: 'nowrap' }}>
            {[['Leads', leads.length], ['Booked', count('Call Booked')], ['Won', count('Won')]].map(([k, v]) => (
              <div key={k} style={{ flex: 1, textAlign: 'center', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--ink-700)', border: '1px solid var(--hairline)' }}>
                <dd style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-strong)' }}>{v}</dd>
                <dt className="vx-stat__label" style={{ marginTop: 4 }}>{k}</dt>
              </div>
            ))}
          </dl>
        </section>

        <section className="vx-card" aria-labelledby="d-funnel">
          <div className="vx-card__head"><div><p className="vx-card__eyebrow">Pipeline</p><h2 className="vx-card__title" id="d-funnel">Lead funnel</h2></div><span className="vx-card__meta">{leads.length} leads</span></div>
          {leads.length === 0 ? (
            <EmptyState compact icon="users" title="No leads yet" body="Import a CSV, add one by hand, or ask the CEO to research prospects." action={<Link href="/leads" className="vx-linkbtn">Add leads</Link>} />
          ) : (
            <ul className="vx-bars">
              {funnel.map(([label, n, alt]) => (
                <li key={label}><span className="vx-bars__label">{label}</span><span className="vx-bars__track"><span className="vx-bars__fill" data-alt={alt} style={{ width: `${(n / maxF) * 100}%` }} /></span><span className="vx-bars__n">{n}</span></li>
              ))}
            </ul>
          )}
          <p className="vx-stat__note" style={{ marginTop: 'var(--space-4)' }}>Pipeline value (expected + invoiced): <strong style={{ color: 'var(--text-strong)' }}>{money(pipelineValue)}</strong></p>
        </section>

        <section className="vx-card" aria-labelledby="d-revenue">
          <div className="vx-card__head"><div><p className="vx-card__eyebrow">This month</p><h2 className="vx-card__title" id="d-revenue">Revenue target</h2></div></div>
          {target > 0 ? (
            <div className="vx-row" style={{ gap: 'var(--space-5)', flexWrap: 'nowrap' }}>
              <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`${pct}% of the monthly revenue target`}
                style={{ width: 96, height: 96, borderRadius: '50%', flex: '0 0 auto', display: 'grid', placeItems: 'center', background: `conic-gradient(var(--violet-400) ${pct * 3.6}deg, rgba(255,255,255,0.08) 0)` }}>
                <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--ink-800)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--text-strong)' }}>{pct}%</div>
              </div>
              <dl style={{ margin: 0, flex: 1, display: 'grid', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                {[['Target', money(target)], ['Paid', money(paidThisMonth)], ['Pipeline', money(pipelineValue)]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><dt style={{ color: 'var(--text-muted)' }}>{k}</dt><dd style={{ margin: 0, color: 'var(--text-strong)', fontWeight: 600 }}>{v}</dd></div>
                ))}
              </dl>
            </div>
          ) : (
            <EmptyState compact icon="dollar" title="No monthly target set" body="Set a revenue target so the CEO can plan against it." action={<Link href="/settings" className="vx-linkbtn">Set target</Link>} />
          )}
          <p style={{ margin: 'var(--space-4) 0 0' }}><Link href="/revenue" className="vx-linkbtn">View revenue</Link></p>
        </section>
      </div>

      <div className="vx-grid vx-grid--2">
        <section className="vx-card" aria-labelledby="d-goals">
          <div className="vx-card__head"><div><p className="vx-card__eyebrow">Priorities</p><h2 className="vx-card__title" id="d-goals">Goals</h2></div><span className="vx-card__meta">{goalsDone} / {goals.length} done</span></div>
          <form onSubmit={addGoal} className="vx-row" style={{ flexWrap: 'nowrap', marginBottom: 'var(--space-3)' }}>
            <input
              value={goalDraft} onChange={e => setGoalDraft(e.target.value)} aria-label="New goal" placeholder="Add a goal..." maxLength={160}
              style={{ flex: 1, minWidth: 0, height: 44, padding: '0 14px', borderRadius: 'var(--radius-md)', background: 'var(--ink-800)', border: '1px solid var(--border-default)', color: 'var(--text-body)', fontSize: 'var(--text-base)' }}
            />
            <Button type="submit" disabled={goalBusy || !goalDraft.trim()} leadingIcon={<VxIcon name="plus" size={16} color="#fff" />}>{goalBusy ? 'Adding...' : 'Add'}</Button>
          </form>
          {goals.length === 0 ? (
            <EmptyState compact icon="target" title="No goals yet" body="Write down what has to happen this week; the CEO plans around it." />
          ) : (
            <ul className="vx-list">
              {goals.map(g => (
                <li key={g.id}>
                  <button type="button" role="checkbox" aria-checked={g.status === 'Completed'} aria-label={`Mark "${g.title}" ${g.status === 'Completed' ? 'not done' : 'done'}`} className="vx-check" onClick={() => toggleGoal(g)}>
                    <span className="vx-check__box">{g.status === 'Completed' ? <VxIcon name="check" size={13} color="#fff" /> : null}</span>
                  </button>
                  <span className="vx-list__text" data-done={g.status === 'Completed'}>{g.title}</span>
                  <button type="button" className="vx-iconaction" aria-label={`Archive goal "${g.title}"`} onClick={() => archiveGoal(g)}><VxIcon name="close" size={16} /></button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="vx-card" aria-labelledby="d-active">
          <div className="vx-card__head"><div><p className="vx-card__eyebrow">Agents</p><h2 className="vx-card__title" id="d-active">Active work</h2></div><Link href="/tasks" className="vx-linkbtn">All tasks</Link></div>
          {active.length === 0 ? (
            <EmptyState compact icon="usercheck" title="No agents are working right now" body="Give the CEO a goal and the tasks it creates will show up here." action={<Link href="/ceo" className="vx-linkbtn">Open CEO Console</Link>} />
          ) : (
            <ul className="vx-list">
              {active.map(t => (
                <li key={t.id}>
                  <span className="vx-list__text"><strong style={{ color: 'var(--text-strong)' }}>{t.title}</strong><br /><span className="vx-stat__note">{t.agent_name} - {t.status}</span></span>
                  <Badge tone={PRIORITY_TONE[t.priority] ?? 'neutral'}>{t.priority}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
