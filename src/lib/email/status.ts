import { listProviders, selectProvider, guardrailConfig, type ProviderStatus, type ProviderId } from './config';
import { countConfirmedSendsToday } from './usage';
import { getOwnerEmail } from '../auth/owner';
import { GMAIL_FROM } from './gmail';
import { resendFrom } from './resend';

export interface EmailStatus {
  ready: boolean;
  problems: string[];
  providers: ProviderStatus[];
  requested: string;
  selected: ProviderId | null;
  selectionReason?: string;
  fromAddress: string | null;
  replyTo: string | null;
  killSwitch: { engaged: boolean; envVar: 'OUTREACH_SEND_ENABLED' };
  cap: { limit: number; sentToday: number; remaining: number; envVar: 'OUTREACH_DAILY_CAP' };
  blacklistEntries: number;
  ownerEmail: string | null;
}

/** Names only - never secret values. */
export async function getEmailStatus(): Promise<EmailStatus> {
  const providers = listProviders();
  const sel = selectProvider();
  const g = guardrailConfig();
  const owner = getOwnerEmail();
  let sentToday = 0;
  try { sentToday = await countConfirmedSendsToday(); } catch { /* counted as 0; DB problems surface elsewhere */ }

  const problems: string[] = [];
  if (!sel.provider) problems.push(sel.reason || 'No email provider configured.');
  if (g.killSwitchEngaged) problems.push('Kill switch is ON (OUTREACH_SEND_ENABLED=false): approved messages will not be sent.');
  if (sentToday >= g.dailyCap) problems.push(`Daily cap reached (${sentToday}/${g.dailyCap}).`);
  if (!owner) problems.push('OWNER_EMAIL is not set: the "Send test email" button needs it, and API access cannot be restricted to you.');
  const chosen = providers.find(p => p.id === sel.provider);
  if (chosen?.warning) problems.push(chosen.warning);

  const fromAddress = !sel.provider ? null : sel.provider === 'resend' ? resendFrom() : GMAIL_FROM();
  return {
    ready: !!sel.provider && !g.killSwitchEngaged && sentToday < g.dailyCap && !chosen?.warning,
    problems,
    providers,
    requested: sel.requested,
    selected: sel.provider,
    selectionReason: sel.reason,
    fromAddress,
    replyTo: process.env.EMAIL_REPLY_TO || owner || process.env.GMAIL_USER || null,
    killSwitch: { engaged: g.killSwitchEngaged, envVar: 'OUTREACH_SEND_ENABLED' },
    cap: { limit: g.dailyCap, sentToday, remaining: Math.max(0, g.dailyCap - sentToday), envVar: 'OUTREACH_DAILY_CAP' },
    blacklistEntries: g.blacklist.length,
    ownerEmail: owner,
  };
}
