import { db } from '../db';
import type { EntityGoal, EntityDepartment } from '../types';
import { requestApproval } from './approvals';

/**
 * Entity Phase 2 — the Goal Cascade engine.
 *
 * BHAG → quarter → month → week. The Core drafts, Barry ratifies through the
 * Approval Queue (type 'goal_ratification'), and only then do goals become
 * real rows. Weekly department goals derive automatically inside a ratified
 * month. Doctrine: Obsidian → Entity/Goal Cascade.md.
 */

// The BHAG revenue staircase (Obsidian → BHAG.md). Month 1 = July 2026.
export const BHAG_START = { year: 2026, month: 7 }; // 1-based month
export const REVENUE_STAIRCASE: Record<number, { revenue: number; driver: string }> = {
  1: { revenue: 3000, driver: '1 implementation deal (dental, AI Receptionist)' },
  2: { revenue: 6000, driver: '2 implementation deals' },
  3: { revenue: 10000, driver: '3 deals + first retainers' },
  4: { revenue: 15000, driver: '3 deals + growing retainer base' },
  5: { revenue: 20000, driver: 'deals + retainers compounding' },
  6: { revenue: 25000, driver: 'mix of deals + $5k+ MRR' },
  12: { revenue: 50000, driver: 'productized templates + retainers dominate' },
};

export function monthIndexOf(date = new Date()): number {
  return (date.getFullYear() - BHAG_START.year) * 12 + (date.getMonth() + 1 - BHAG_START.month) + 1;
}

export function staircaseTarget(monthIndex: number): { revenue: number; driver: string } {
  if (REVENUE_STAIRCASE[monthIndex]) return REVENUE_STAIRCASE[monthIndex];
  // Interpolate between defined steps
  const keys = Object.keys(REVENUE_STAIRCASE).map(Number).sort((a, b) => a - b);
  const below = keys.filter(k => k < monthIndex).pop();
  const above = keys.find(k => k > monthIndex);
  if (below === undefined) return REVENUE_STAIRCASE[keys[0]];
  if (above === undefined) return REVENUE_STAIRCASE[keys[keys.length - 1]];
  const lo = REVENUE_STAIRCASE[below], hi = REVENUE_STAIRCASE[above];
  const t = (monthIndex - below) / (above - below);
  return { revenue: Math.round((lo.revenue + (hi.revenue - lo.revenue) * t) / 500) * 500, driver: lo.driver };
}

export function monthPeriod(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function weekPeriod(date = new Date()): string {
  // ISO week number
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// Standing weekly department goal templates (Obsidian → Entity/Goal Cascade.md)
const WEEKLY_TEMPLATE: { department: EntityDepartment; title: string; target: Record<string, unknown> }[] = [
  { department: 'growth', title: '4–5 Reels shipped (dental-heavy rotation)', target: { reels: 4 } },
  { department: 'revenue', title: 'Qualify leads · ≥1 proposal in progress · 100% follow-up SLA', target: { proposals_in_progress: 1, followup_sla: 1 } },
  { department: 'delivery', title: 'Active builds on time · client check-ins done', target: { on_time: 1 } },
  { department: 'product', title: 'Document current build for templatization', target: { builds_documented: 1 } },
  { department: 'finance', title: 'Morning revenue math · gap alert if needed', target: { revenue_math_days: 7 } },
  { department: 'intelligence', title: 'Ledger current · 1 intel brief · memory sync', target: { intel_briefs: 1 } },
  { department: 'governance', title: 'Queue decision-ready · 0 unauthorized actions', target: { unauthorized_actions: 0 } },
];

export interface CascadeDraft {
  monthPeriod: string;
  monthIndex: number;
  revenueTarget: number;
  driver: string;
  closedSoFar: number;
  weekly: typeof WEEKLY_TEMPLATE;
}

/** Build next (or current) month's cascade draft and file it for ratification. */
export async function draftMonthlyCascade(forDate = new Date()): Promise<{ requestId: string; draft: CascadeDraft }> {
  const period = monthPeriod(forDate);
  const idx = monthIndexOf(forDate);
  const step = staircaseTarget(idx);

  const revenues = await db.getRevenue();
  const closedSoFar = revenues
    .filter(r => r.status === 'Paid' && (r.month === period))
    .reduce((acc, r) => acc + Number(r.amount), 0);

  const draft: CascadeDraft = {
    monthPeriod: period,
    monthIndex: idx,
    revenueTarget: step.revenue,
    driver: step.driver,
    closedSoFar,
    weekly: WEEKLY_TEMPLATE,
  };

  const request = await requestApproval({
    type: 'goal_ratification',
    department: 'core',
    createdByAgent: 'Alex (CEO Agent)',
    title: `Ratify ${period} goal cascade — $${step.revenue.toLocaleString()} target (BHAG month ${idx})`,
    context: [
      `BHAG staircase month ${idx}: $${step.revenue.toLocaleString()} — ${step.driver}.`,
      `Closed so far in ${period}: $${closedSoFar.toLocaleString()}.`,
      `Ratifying instantiates the month goal + ${WEEKLY_TEMPLATE.length} weekly department goals for the current week.`,
      `Doctrine: Entity/Goal Cascade.md.`,
    ].join('\n'),
    payload: draft as unknown as Record<string, unknown>,
    recommendation: 'Ratify. Targets follow the BHAG staircase you set.',
    confidence: 9,
  });

  return { requestId: request.id, draft };
}

/** Called by the approvals executor when Barry ratifies a cascade. */
export async function instantiateCascade(payload: CascadeDraft): Promise<string> {
  const now = new Date().toISOString();
  const existing = await db.getEntityGoals({ period: payload.monthPeriod, level: 'month' });
  let monthGoal = existing.find(g => g.status !== 'missed');

  if (!monthGoal) {
    monthGoal = await db.addEntityGoal({
      level: 'month',
      department: null,
      title: `$${payload.revenueTarget.toLocaleString()} — ${payload.driver}`,
      target: { revenue: payload.revenueTarget },
      actuals: { revenue: payload.closedSoFar },
      status: 'active',
      period: payload.monthPeriod,
      ratified_at: now,
    });
  } else {
    await db.updateEntityGoal(monthGoal.id, { status: 'active', ratified_at: now, target: { revenue: payload.revenueTarget } });
  }

  const wk = weekPeriod();
  const existingWeek = await db.getEntityGoals({ period: wk, level: 'week' });
  let created = 0;
  for (const t of payload.weekly) {
    if (existingWeek.some(g => g.department === t.department)) continue;
    await db.addEntityGoal({
      level: 'week',
      parent_id: monthGoal.id,
      department: t.department,
      title: t.title,
      target: t.target,
      status: 'active',
      period: wk,
      ratified_at: now,
    });
    created++;
  }

  return `Cascade ratified: ${payload.monthPeriod} month goal active, ${created} weekly department goals created for ${wk}.`;
}

/** Current cascade snapshot for the dashboard + daily pulse. */
export async function getCascadeSnapshot(): Promise<{
  month: EntityGoal | null;
  weekly: EntityGoal[];
  monthPeriod: string;
  weekPeriod: string;
  closedThisMonth: number;
}> {
  const mp = monthPeriod();
  const wp = weekPeriod();
  const [monthGoals, weeklyGoals, revenues] = await Promise.all([
    db.getEntityGoals({ period: mp, level: 'month' }),
    db.getEntityGoals({ period: wp, level: 'week' }),
    db.getRevenue(),
  ]);
  const closedThisMonth = revenues
    .filter(r => r.status === 'Paid' && r.month === mp)
    .reduce((acc, r) => acc + Number(r.amount), 0);
  return {
    month: monthGoals.find(g => g.status === 'active') ?? monthGoals[0] ?? null,
    weekly: weeklyGoals,
    monthPeriod: mp,
    weekPeriod: wp,
    closedThisMonth,
  };
}
