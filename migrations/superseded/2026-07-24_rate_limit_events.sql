-- Rate limiter backing store (standalone, idempotent).
-- Run this in the Supabase SQL Editor. Safe to run more than once.
-- Replaces the in-memory Map in src/lib/auth/rateLimit.ts, which reset per
-- serverless instance and was not a real limit in production (AUDIT_REPORT.md M3).
-- Written/read only via the service-role client (src/lib/auth/rateLimit.ts) —
-- no anon/authenticated policy is defined, so RLS blocks all client access.

create table if not exists public.rate_limit_events (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);

alter table public.rate_limit_events enable row level security;

create index if not exists rate_limit_events_key_created_idx
  on public.rate_limit_events (key, created_at desc);
