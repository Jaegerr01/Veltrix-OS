import { db } from '../db';
import { runAgentLogic } from './executor';

/**
 * Autopilot entry point for a single lead (fired when a lead is created or
 * imported from the scraper).
 *
 * This used to be a third, divergent copy of the research→outreach logic —
 * and it had a serious bug: it marked outreach messages as "Sent" without
 * ever dispatching an email. Every "sent" message from the old autopilot was
 * a phantom.
 *
 * Now it delegates to the executor, the single source of truth for agent
 * behavior:
 *   Daniel (leadResearch): fetches the lead's live website, writes a research
 *     brief into the lead's notes, scores, and — if qualified (≥7) — triggers
 *     Emma automatically.
 *   Emma (outreach): drafts a research-informed note, has Olivia (proposal)
 *     generate a custom proposal, and sends the combined email through the
 *     guarded sender (Gmail → Resend, kill switch, daily cap, blacklist).
 *     If delivery is refused, everything stays as Draft — no phantom sends.
 */
export async function runAutopilotForLead(leadId: string) {
  try {
    const leads = await db.getLeads();
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // Already researched? Don't re-run the chain.
    if (lead.lead_score && lead.lead_score > 0) return;

    await db.logAgentAction(
      'Lead Research Agent',
      'Autopilot: Start Lead Research',
      `leadId=${leadId}, name=${lead.business_name}`,
      undefined,
      'Success'
    );

    const result = await runAgentLogic('leadResearch', { leadId }, true);

    await db.logAgentAction(
      'Lead Research Agent',
      'Autopilot: Lead Research Completed',
      `leadId=${leadId}, name=${lead.business_name}`,
      result.success ? result.result : result.error,
      result.success ? 'Success' : 'Failure'
    );
  } catch (error: any) {
    console.error('Error running Autopilot for lead:', error);
  }
}
