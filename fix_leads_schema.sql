-- ================================================================
-- VELTRIX Command OS — Leads Schema Fix
-- Run in: supabase.com/dashboard/project/sxueyuqpqeqvzuzhrhxo/sql/new
-- Safe to run: all affected tables are currently empty
-- ================================================================

-- Step 1: Drop tables that depend on leads (all empty, no data lost)
drop table if exists public.proposals cascade;
drop table if exists public.followups cascade;
drop table if exists public.outreach_messages cascade;
drop table if exists public.lead_scores cascade;
drop table if exists public.leads cascade;

-- Step 2: Recreate leads with correct schema
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  business_name text not null,
  contact_name text,
  industry text,
  website text,
  email text,
  phone text,
  social_link text,
  location text,
  pain_point text,
  lead_score numeric default 0,
  status text default 'New',
  source text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Step 3: Recreate lead_scores
create table public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  website_score numeric,
  branding_score numeric,
  automation_need_score numeric,
  ability_to_pay_score numeric,
  urgency_score numeric,
  total_score numeric,
  reasoning text,
  created_at timestamptz default now()
);

-- Step 4: Recreate outreach_messages
create table public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  channel text,
  message text not null,
  status text default 'Draft',
  approval_status text default 'Pending Approval',
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- Step 5: Recreate followups
create table public.followups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  followup_date date,
  followup_type text,
  message text,
  status text default 'Pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Step 6: Recreate proposals (with client FK preserved)
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  problem text,
  solution text,
  deliverables text[],
  timeline text,
  price numeric not null default 0,
  payment_terms text,
  status text default 'Draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Step 7: Restore FK from tasks to leads
alter table public.tasks
  drop constraint if exists tasks_related_lead_id_fkey;
alter table public.tasks
  add constraint tasks_related_lead_id_fkey
  foreign key (related_lead_id) references public.leads(id) on delete set null;

-- Step 8: Enable RLS on all recreated tables
alter table public.leads enable row level security;
alter table public.lead_scores enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.followups enable row level security;
alter table public.proposals enable row level security;

-- Step 9: RLS policies
drop policy if exists "Users can access their own leads" on public.leads;
drop policy if exists "Users can access their own lead scores" on public.lead_scores;
drop policy if exists "Users can access their own outreach" on public.outreach_messages;
drop policy if exists "Users can access their own followups" on public.followups;
drop policy if exists "Users can access their own proposals" on public.proposals;

create policy "Users can access their own leads"
  on public.leads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own lead scores"
  on public.lead_scores for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own outreach"
  on public.outreach_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own followups"
  on public.followups for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own proposals"
  on public.proposals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Step 10: Realtime (re-add tables to publication after drop/recreate)
do $$ begin
  alter publication supabase_realtime add table public.leads;
exception when others then null; end; $$;
do $$ begin
  alter publication supabase_realtime add table public.proposals;
exception when others then null; end; $$;
do $$ begin
  alter publication supabase_realtime add table public.followups;
exception when others then null; end; $$;

-- Step 11: Ensure new-user trigger exists (creates public.users row on signup)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  insert into public.profiles (
    id, business_name, description, target_monthly_revenue, autopilot
  ) values (
    new.id, 'VELTRIX Enterprise', 'A business powered by VELTRIX OS.', 6000, false
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Step 12: Backfill public.users for any existing auth accounts
insert into public.users (id, email, created_at)
select id, email, created_at from auth.users
on conflict (id) do nothing;
