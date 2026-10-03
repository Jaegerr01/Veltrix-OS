-- ============================================================================
-- PostelOS - ONE-TIME DATA CORRECTION  (NOT AUTO-RUN; Barry runs this by hand, ONCE)
-- ----------------------------------------------------------------------------
-- WHY: before Phase 2 the app recorded Sent / Contacted / Proposal Sent without
-- any confirmed delivery. NOTHING was ever actually emailed. This file resets those
-- false states so the UI stops lying.
--
-- ORDER:  1) 2026-10-02_001_send_state.sql   2) this file   (002/003 are independent)
-- Wrapped in a transaction. Review the SELECT counts first (STEP 0), then run all.
-- A row counts as "falsely sent" if status='Sent' and provider_message_id is NULL
-- (the only trustworthy proof of delivery, written exclusively by the new send pipeline).
-- Social DMs attested by the owner carry provider='manual' + a provider_message_id, so they are kept.
-- ============================================================================

-- STEP 0 (dry run): how many rows will change?
select 'outreach_messages' as tbl, count(*) from public.outreach_messages where status = 'Sent' and provider_message_id is null
union all select 'followups', count(*) from public.followups where status = 'Sent' and provider_message_id is null
union all select 'proposals', count(*) from public.proposals where status = 'Sent' and provider_message_id is null;

begin;

-- STEP 1: outreach messages that were never delivered -> back to Approved (if you had approved) or Draft.
update public.outreach_messages
   set status = case when approval_status = 'Approved' then 'Approved' else 'Draft' end,
       sent_at = null,
       error = 'Reset by data correction: previously marked Sent without a confirmed delivery.'
 where status = 'Sent' and provider_message_id is null;

-- STEP 2: follow-ups falsely Sent -> Drafted (has text) / Pending.
update public.followups
   set status = case when coalesce(message, '') <> '' then 'Drafted' else 'Pending' end,
       sent_at = null,
       error = 'Reset by data correction: previously marked Sent without a confirmed delivery.',
       updated_at = now()
 where status = 'Sent' and provider_message_id is null;

-- STEP 3: proposals falsely Sent -> Draft.
update public.proposals
   set status = 'Draft',
       sent_at = null,
       error = 'Reset by data correction: previously marked Sent without a confirmed delivery.',
       updated_at = now()
 where status = 'Sent' and provider_message_id is null;

-- STEP 4: leads that were pushed to Contacted / Proposal Sent with no confirmed send of any kind
--         (and no reply) go back to the pre-contact stage: Qualified if scored, else New.
update public.leads l
   set status = case when exists (select 1 from public.lead_scores s where s.lead_id = l.id) then 'Qualified' else 'New' end,
       updated_at = now()
 where l.status in ('Contacted', 'Proposal Sent')
   and not exists (select 1 from public.outreach_messages m where m.lead_id = l.id and (m.status = 'Replied' or (m.status = 'Sent' and m.provider_message_id is not null)))
   and not exists (select 1 from public.followups f where f.lead_id = l.id and f.status = 'Sent' and f.provider_message_id is not null)
   and not exists (select 1 from public.proposals p where p.lead_id = l.id and (p.status in ('Viewed', 'Accepted') or (p.status = 'Sent' and p.provider_message_id is not null)));

-- STEP 5: tasks that claimed to have completed a send. Narrow match on the exact phrases the old agents wrote.
update public.tasks
   set status = 'Pending', result = null, error = 'Reset by data correction: the send this task reported never happened.'
 where status = 'Completed'
   and (agent_name ilike '%follow%' or agent_name ilike '%proposal%' or agent_name ilike '%outreach%' or agent_name ilike '%emma%' or agent_name ilike '%sofia%')
   and (result ilike '%autonomously sent%' or result ilike '%marked sent in crm%' or result ilike '%has been sent%' or result ilike '%was sent%');

-- STEP 6: lock the invariant in the database - a row can never be 'Sent' again without proof.
alter table public.outreach_messages drop constraint if exists outreach_sent_requires_proof;
alter table public.outreach_messages add constraint outreach_sent_requires_proof
  check (status <> 'Sent' or (provider_message_id is not null and sent_at is not null));
alter table public.followups drop constraint if exists followups_sent_requires_proof;
alter table public.followups add constraint followups_sent_requires_proof
  check (status <> 'Sent' or (provider_message_id is not null and sent_at is not null));
alter table public.proposals drop constraint if exists proposals_sent_requires_proof;
alter table public.proposals add constraint proposals_sent_requires_proof
  check (status <> 'Sent' or (provider_message_id is not null and sent_at is not null));

commit;
