-- PostelOS Phase 2 / Migration 003 - CEO ORCHESTRATION columns on public.tasks (idempotent).
-- status values used by the app: Pending (queued) | In Progress (running) | Completed (done) | Failed | Blocked | Needs Approval
alter table public.tasks add column if not exists run_id               uuid;
alter table public.tasks add column if not exists depends_on           uuid[] default '{}';
alter table public.tasks add column if not exists requires_approval    boolean not null default false;
alter table public.tasks add column if not exists approval_request_id  uuid;
alter table public.tasks add column if not exists error                text;
alter table public.tasks add column if not exists started_at           timestamptz;
alter table public.tasks add column if not exists finished_at          timestamptz;
alter table public.tasks add column if not exists created_by           text;     -- 'CEO' | 'ARIA' | 'user' | agent name
create index if not exists tasks_run_idx on public.tasks (user_id, run_id);
