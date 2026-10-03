import { z } from 'zod';

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;

export const PlanTaskSchema = z.object({
  key: z.string().min(1).max(40),
  agent: z.string().min(1).max(40),
  title: z.string().min(3).max(160),
  params: z.record(z.string(), z.unknown()).default({}),
  priority: z.enum(PRIORITIES).default('Medium'),
  dueInDays: z.number().int().min(0).max(60).optional(),
  dependsOn: z.array(z.string().max(40)).max(8).default([]),
});

export const PlanSchema = z.object({
  /** What the CEO says back (answer, or a one-line description of the plan). Never a claim that work is done. */
  reply: z.string().max(3000).default(''),
  tasks: z.array(PlanTaskSchema).max(8).default([]),
});

export type PlanTask = z.infer<typeof PlanTaskSchema>;
export type Plan = z.infer<typeof PlanSchema>;

/** What each core agent needs. `outward` agents only ever DRAFT + queue approval; they never send. */
export const AGENT_SPECS: Record<string, { required: string[]; describe: string; outward?: boolean }> = {
  ceo: { required: [], describe: 'Compile today\'s daily action plan/report from live data. params: {}' },
  revenue: { required: [], describe: 'Revenue gap + what it takes to close it. params: {} (optional {"websites":n,"receptionists":n} scenario)' },
  sales: { required: ['leadId'], describe: 'Sales pitch/objection plan for one lead. params: {"leadId"}' },
  leadResearch: { required: ['leadId'], describe: 'Research the lead\'s real website and score/qualify it. params: {"leadId"}' },
  outreach: { required: ['leadId', 'offerName'], outward: true, describe: 'Draft outreach copy and queue it for approval (never sends). params: {"leadId","offerName","channel":"Email|LinkedIn|Instagram|Discord"}' },
  followup: { required: ['leadId'], outward: true, describe: 'Draft a follow-up and queue it for approval (never sends). params: {"leadId","sequenceDay":3|7|14|30}' },
  proposal: { required: ['leadId', 'offerName'], outward: true, describe: 'Draft a proposal and queue it for approval (never sends). params: {"leadId","offerName","price":number}' },
  content: { required: ['topic'], describe: 'Social content ideas saved to the Social Writer. params: {"topic"}' },
  delivery: { required: ['projectId'], describe: 'Delivery roadmap for a project. params: {"projectId"}' },
  memory: { required: ['query'], describe: 'Search saved notes/memories. params: {"query"}' },
  support: { required: ['query'], describe: 'Answer from stored documentation. params: {"query"}' },
  scraper: { required: ['niche', 'location'], describe: 'Run the lead scraper (local dev machine only). params: {"niche","location","limit"}' },
  specialist: { required: ['slug', 'task'], describe: 'Hand a task to a named catalogue specialist. params: {"slug","task"}' },
};

export const OUTWARD_AGENTS = Object.entries(AGENT_SPECS).filter(([, v]) => v.outward).map(([k]) => k);
