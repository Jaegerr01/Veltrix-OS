-- PostelOS Phase 2 / Migration 002 - CORE TABLES (idempotent). Folds the three standalone
-- 2026-07 migrations (approval_requests, entity_goals, rate_limit_events) into one coherent,
-- re-runnable step and adds the 'failed' approval status used when an approved action's execution fails.
-- Safe to run even if the older files were already applied.

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,               -- outreach_send | followup_send | proposal_send | publish | spend | price_change | playbook_edit | structural | goal_ratification
  department text not null,
  created_by_agent text not null,
  title text not null,
  context text,
  payload jsonb not null,
  recommendation text,
  confidence integer,
  status text default 'pending',    -- pending | approved | approved_edited | rejected | expired | failed
  decision_payload jsonb,
  rejection_reason text,
  execution_result text,
  created_at timestamptz default now(),
  decided_at timestamptz
);
alter table public.approval_requests enable row level security;
drop policy if exists "Users can access their own approval requests" on public.approval_requests;
create policy "Users can access their own approval requests" on public.approval_requests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists approval_requests_status_idx on public.approval_requests (user_id, status, created_at desc);

create table if not exists public.entity_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  level text not null,
  parent_id uuid references public.entity_goals(id) on delete set null,
  department text,
  title text not null,
  target jsonb,
  actuals jsonb,
  status text default 'draft',
  period text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  ratified_at timestamptz
);
alter table public.entity_goals enable row level security;
drop policy if exists "Users can access their own entity goals" on public.entity_goals;
create policy "Users can access their own entity goals" on public.entity_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.rate_limit_events (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);
alter table public.rate_limit_events enable row level security;   -- service-role only (no policy on purpose)
create index if not exists rate_limit_events_key_created_idx on public.rate_limit_events (key, created_at desc);
