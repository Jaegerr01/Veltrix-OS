-- ================================================================
-- RESET_DEV_ONLY.sql  --  DESTRUCTIVE.  DEVELOPMENT / THROWAWAY DATABASES ONLY.
-- NEVER run this against production. It DROPS every PostelOS table (and all rows in them) CASCADE.
-- Extracted from supabase_schema.sql, which is now non-destructive (create ... if not exists).
-- To rebuild a dev database: run this file, then supabase_schema.sql, then migrations/ in README order.
-- ================================================================
do $$ begin
  raise notice 'RESET_DEV_ONLY: dropping all PostelOS tables';
end $$;

drop table if exists public.community_metrics cascade;
drop table if exists public.ad_campaigns cascade;
drop table if exists public.content_ideas cascade;
drop table if exists public.expenses cascade;
drop table if exists public.daily_reports cascade;
drop table if exists public.offers cascade;
drop table if exists public.goals cascade;
drop table if exists public.agent_memory cascade;
drop table if exists public.notes cascade;
drop table if exists public.activities cascade;
drop table if exists public.revenue cascade;
drop table if exists public.tasks cascade;
drop table if exists public.projects cascade;
drop table if exists public.proposals cascade;
drop table if exists public.followups cascade;
drop table if exists public.outreach_messages cascade;
drop table if exists public.lead_scores cascade;
drop table if exists public.leads cascade;
drop table if exists public.profiles cascade;
drop table if exists public.clients cascade;
drop table if exists public.users cascade;
drop function if exists public.match_notes(vector, float, int, uuid) cascade;
drop function if exists public.handle_new_user() cascade;
drop table if exists public.tasks cascade;
drop table if exists public.approval_requests cascade;
drop table if exists public.entity_goals cascade;
drop table if exists public.rate_limit_events cascade;
