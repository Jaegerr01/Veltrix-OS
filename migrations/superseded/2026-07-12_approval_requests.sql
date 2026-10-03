-- Entity Phase 1 — Approval Queue migration (standalone, idempotent).
-- Run this in the Supabase SQL Editor. Safe to run more than once.
-- Full context: Obsidian vault → Entity/Command OS Implementation Roadmap.md

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,               -- outreach_send | proposal_send | publish | spend | price_change | playbook_edit | structural | goal_ratification
  department text not null,         -- core | intelligence | growth | revenue | delivery | product | finance | governance
  created_by_agent text not null,
  title text not null,
  context text,
  payload jsonb not null,
  recommendation text,
  confidence integer,
  status text default 'pending',    -- pending | approved | approved_edited | rejected | expired
  decision_payload jsonb,
  rejection_reason text,
  execution_result text,
  created_at timestamptz default now(),
  decided_at timestamptz
);

alter table public.approval_requests enable row level security;

drop policy if exists "Users can access their own approval requests" on public.approval_requests;
create policy "Users can access their own approval requests"
  on public.approval_requests for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists approval_requests_status_idx
  on public.approval_requests (user_id, status, created_at desc);
