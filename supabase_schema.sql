-- Supabase Database Schema SQL for VELTRIX COMMAND OS (v2 - Production Single Source of Truth)
-- Execute this script in your Supabase SQL Editor to set up isolated tables and triggers.

-- Enable UUID and Vector extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- Clean reset existing tables to avoid conflict with legacy column structures
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

-- 1. users (public table linking auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now()
);

-- 2. profiles (combining user settings and business details)
create table if not exists public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
  business_name text not null default 'VELTRIX automation',
  description text default 'My business powered by VELTRIX OS',
  services text[] default array['AI Website Development', 'AI Receptionist Chatbots'],
  target_monthly_revenue numeric default 6000,
  current_monthly_revenue numeric default 0,
  primary_offer text default 'AI Website System',
  secondary_offer text default 'AI Receptionist Voice/Chatbot',
  target_markets text[] default array['Local Medical Clinics', 'Chiropractors', 'Dentists'],
  autopilot boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. leads
create table if not exists public.leads (
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

-- 4. lead_scores
create table if not exists public.lead_scores (
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

-- 5. outreach_messages
create table if not exists public.outreach_messages (
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

-- 6. followups
create table if not exists public.followups (
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

-- 7. proposals
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  client_id uuid, -- will link to client table
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

-- 8. clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  business_name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  service_purchased text,
  total_value numeric default 0,
  monthly_retainer numeric default 0,
  status text default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Foreign key update on proposals to reference public.clients
alter table public.proposals 
  add constraint fk_proposals_client 
  foreign key (client_id) 
  references public.clients(id) 
  on delete set null;

-- 9. projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  project_name text not null,
  service_type text,
  status text default 'Discovery',
  deadline date,
  requirements text,
  deliverables text[],
  revision_count integer default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 10. tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  agent_name text,
  title text not null,
  description text,
  priority text default 'Medium',
  status text default 'Pending',
  due_date date,
  result text,
  related_goal_id uuid, -- kept for client compatibility
  related_lead_id uuid references public.leads(id) on delete set null,
  related_client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 11. revenue
create table if not exists public.revenue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  proposal_id uuid references public.proposals(id) on delete set null,
  amount numeric not null,
  type text default 'Project',
  status text default 'Expected',
  payment_date date,
  month text,
  notes text,
  created_at timestamptz default now()
);

-- 12. activities (unified logging table for agents, tools, and system events)
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null, -- 'agent', 'tool', 'system'
  actor text, -- agent name, tool name, or user
  action text not null,
  input jsonb,
  output jsonb,
  status text,
  error text,
  created_at timestamptz default now()
);

-- 13. notes (unified table for user manual notes and AI business memories)
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text,
  content text not null,
  tags text[],
  importance numeric default 5,
  source text,
  embedding vector(768),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RPC function for semantic matching of notes/memories
create or replace function match_notes (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
) returns table (
  id uuid,
  content text,
  tags text[],
  importance numeric,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    n.id,
    n.content,
    n.tags,
    n.importance,
    1 - (n.embedding <=> query_embedding) as similarity
  from public.notes n
  where n.user_id = p_user_id
    and n.embedding is not null
    and 1 - (n.embedding <=> query_embedding) > match_threshold
  order by n.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 14. agent_memory (long-term AI facts, preferences, and state keys)
create table if not exists public.agent_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 15. goals (supporting isolated table)
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  target_amount numeric,
  status text default 'Active',
  priority text default 'High',
  deadline date,
  success_criteria text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 16. offers (supporting isolated table)
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  target_customer text,
  price_min numeric,
  price_max numeric,
  monthly_retainer_min numeric,
  monthly_retainer_max numeric,
  deliverables text[],
  status text default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 17. daily_reports (supporting isolated table)
create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  report_date date default current_date,
  revenue_target numeric default 6000,
  closed_revenue numeric default 0,
  pipeline_value numeric default 0,
  revenue_gap numeric default 6000,
  top_priority text,
  leads_to_contact jsonb,
  followups_due jsonb,
  content_to_post text,
  recommended_action text,
  created_at timestamptz default now()
);

-- 18. expenses (supporting isolated table)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  amount numeric not null,
  category text not null,
  date date not null,
  notes text,
  created_at timestamptz default now()
);

-- 19. content_ideas (supporting isolated table)
create table if not exists public.content_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  platform text not null,
  title text not null,
  hook text,
  content text,
  content_type text,
  status text default 'Idea',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 20. ad_campaigns (supporting isolated table)
create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  platform text,
  status text default 'Draft',
  budget numeric not null,
  spent numeric default 0,
  clicks integer default 0,
  impressions integer default 0,
  conversions integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 21. community_metrics (supporting isolated table)
create table if not exists public.community_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  platform text,
  value text not null,
  change numeric default 0,
  trend text default 'neutral',
  created_at timestamptz default now()
);

-- 22. approval_requests (Entity Phase 1 — propose-then-approve queue.
--     Every autonomous EXTERNAL action becomes a card here and executes
--     only after Barry approves. See Obsidian: Entity/VELTRIX Constitution.)
create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,               -- outreach_send | proposal_send | publish | spend | price_change | playbook_edit | structural | goal_ratification
  department text not null,         -- core | intelligence | growth | revenue | delivery | product | finance | governance
  created_by_agent text not null,
  title text not null,
  context text,                     -- why: lead history, research brief refs
  payload jsonb not null,           -- the exact action (email body + recipient, etc.)
  recommendation text,
  confidence integer,               -- 1-10 from the proposing agent
  status text default 'pending',    -- pending | approved | approved_edited | rejected | expired
  decision_payload jsonb,           -- what Barry actually approved (diff vs payload = learning data)
  rejection_reason text,
  execution_result text,            -- outcome after an approved action ran
  created_at timestamptz default now(),
  decided_at timestamptz
);

-- 23. entity_goals (Entity Phase 2 — goal cascade: BHAG → quarter → month →
--     week → day. Drafted by the Core, ratified by Barry via approval queue.)
create table if not exists public.entity_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  level text not null,              -- bhag | quarter | month | week | day
  parent_id uuid references public.entity_goals(id) on delete set null,
  department text,                  -- set for week/day goals
  title text not null,
  target jsonb,
  actuals jsonb,
  status text default 'draft',      -- draft | ratified | active | completed | missed
  period text not null,             -- '2026' | '2026-Q3' | '2026-07' | '2026-W28'
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  ratified_at timestamptz
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES DEFINITION
-- ==========================================

-- Enable RLS for all tables
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.lead_scores enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.followups enable row level security;
alter table public.proposals enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.revenue enable row level security;
alter table public.activities enable row level security;
alter table public.notes enable row level security;
alter table public.agent_memory enable row level security;
alter table public.goals enable row level security;
alter table public.offers enable row level security;
alter table public.daily_reports enable row level security;
alter table public.expenses enable row level security;
alter table public.content_ideas enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.community_metrics enable row level security;
alter table public.approval_requests enable row level security;
alter table public.entity_goals enable row level security;

-- Drop any legacy public access policies
drop policy if exists "Public Access Profile" on public.profiles;
drop policy if exists "Public Access Goals" on public.goals;
drop policy if exists "Public Access Offers" on public.offers;
drop policy if exists "Public Access Leads" on public.leads;
drop policy if exists "Public Access Lead Scores" on public.lead_scores;
drop policy if exists "Public Access Outreach" on public.outreach_messages;
drop policy if exists "Public Access Followups" on public.followups;
drop policy if exists "Public Access Proposals" on public.proposals;
drop policy if exists "Public Access Clients" on public.clients;
drop policy if exists "Public Access Projects" on public.projects;
drop policy if exists "Public Access Tasks" on public.tasks;
drop policy if exists "Public Access Revenue" on public.revenue;
drop policy if exists "Public Access Memories" on public.notes;
drop policy if exists "Public Access Agent Logs" on public.activities;
drop policy if exists "Public Access Daily Reports" on public.daily_reports;
drop policy if exists "Public Access Expenses" on public.expenses;
drop policy if exists "Public Access Tool Logs" on public.activities;
drop policy if exists "Public Access Content Ideas" on public.content_ideas;
drop policy if exists "Public Access Ad Campaigns" on public.ad_campaigns;
drop policy if exists "Public Access Community Metrics" on public.community_metrics;

-- Create secure, user-isolated policies
create policy "Users can access their own user row" on public.users for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can access their own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can access their own leads" on public.leads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own lead scores" on public.lead_scores for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own outreach" on public.outreach_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own followups" on public.followups for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own proposals" on public.proposals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own clients" on public.clients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own projects" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own tasks" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own revenue" on public.revenue for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own activities" on public.activities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own notes" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own agent memory" on public.agent_memory for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own goals" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own offers" on public.offers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own daily reports" on public.daily_reports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own expenses" on public.expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own content ideas" on public.content_ideas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own ad campaigns" on public.ad_campaigns for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own community metrics" on public.community_metrics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own approval requests" on public.approval_requests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access their own entity goals" on public.entity_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ==========================================
-- AUTH USER TRIGGERS DEFINITION
-- ==========================================

-- Function to handle copying users from auth.users to public tables on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  
  insert into public.profiles (
    id, 
    business_name, 
    description, 
    target_monthly_revenue, 
    autopilot
  )
  values (
    new.id, 
    'VELTRIX Enterprise', 
    'A business powered by VELTRIX OS.', 
    6000, 
    false
  );
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute function on new auth.users signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- REALTIME SUBSCRIPTIONS ENABLING
-- ==========================================

begin;
  -- If publication exists, we add tables to it.
  -- This setup ensures client-side listeners receive updates instantly.
  alter publication supabase_realtime add table public.leads;
  alter publication supabase_realtime add table public.clients;
  alter publication supabase_realtime add table public.tasks;
  alter publication supabase_realtime add table public.proposals;
  alter publication supabase_realtime add table public.followups;
  alter publication supabase_realtime add table public.revenue;
  alter publication supabase_realtime add table public.activities;
  alter publication supabase_realtime add table public.notes;
  alter publication supabase_realtime add table public.projects;
  alter publication supabase_realtime add table public.profiles;
commit;
