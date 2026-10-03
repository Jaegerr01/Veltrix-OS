-- Entity Phase 2 — Goal Cascade migration (standalone, idempotent).
-- Run in the Supabase SQL Editor after the approval_requests migration.
-- Doctrine: Obsidian vault → Entity/Goal Cascade.md

create table if not exists public.entity_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  level text not null,              -- bhag | quarter | month | week | day
  parent_id uuid references public.entity_goals(id) on delete set null,
  department text,                  -- null for bhag/quarter/month; set for week/day goals
  title text not null,
  target jsonb,                     -- e.g. {"revenue": 3000, "mrr": 199} or {"reels": 4}
  actuals jsonb,                    -- filled in by the daily pulse / weekly review
  status text default 'draft',      -- draft | ratified | active | completed | missed
  period text not null,             -- '2026' | '2026-Q3' | '2026-07' | '2026-W28' | '2026-07-14'
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  ratified_at timestamptz
);

alter table public.entity_goals enable row level security;

drop policy if exists "Users can access their own entity goals" on public.entity_goals;
create policy "Users can access their own entity goals"
  on public.entity_goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists entity_goals_period_idx
  on public.entity_goals (user_id, period, level);
