-- PostelOS Phase 2 / Migration 001 - TRUTHFUL SEND STATE   (idempotent, safe to re-run)
-- Run in the Supabase SQL Editor BEFORE the data-correction file.
--
-- State machine (stored in the existing text `status` columns, no enum needed):
--   outreach_messages : Draft -> Approved -> Sending -> Sent | Failed   (+ Replied)
--   followups         : Pending/Drafted -> Approved -> Sending -> Sent | Failed (+ Completed/Skipped)
--   proposals         : Draft -> Pending Approval -> Approved -> Sending -> Sent | Failed (+ Viewed/Accepted/Rejected/Needs Revision)
-- A row may only be 'Sent' when provider_message_id AND sent_at are set (enforced by the app;
-- the optional CHECK constraint is added in DATA_CORRECTION_ONE_TIME_NOT_AUTORUN.sql once old data is fixed).

alter table public.outreach_messages add column if not exists provider            text;
alter table public.outreach_messages add column if not exists provider_message_id text;
alter table public.outreach_messages add column if not exists error               text;
alter table public.outreach_messages add column if not exists attempts            integer not null default 0;
alter table public.outreach_messages add column if not exists sent_at             timestamptz;

alter table public.followups add column if not exists provider            text;
alter table public.followups add column if not exists provider_message_id text;
alter table public.followups add column if not exists error               text;
alter table public.followups add column if not exists attempts            integer not null default 0;
alter table public.followups add column if not exists sent_at             timestamptz;

alter table public.proposals add column if not exists provider            text;
alter table public.proposals add column if not exists provider_message_id text;
alter table public.proposals add column if not exists error               text;
alter table public.proposals add column if not exists attempts            integer not null default 0;
alter table public.proposals add column if not exists sent_at             timestamptz;

create index if not exists outreach_messages_sent_idx on public.outreach_messages (user_id, sent_at desc) where status = 'Sent';
create index if not exists followups_sent_idx         on public.followups         (user_id, sent_at desc) where status = 'Sent';
create index if not exists proposals_sent_idx         on public.proposals         (user_id, sent_at desc) where status = 'Sent';
