-- Supabase Database Schema SQL for VELTRIX COMMAND OS
-- Run this script in the Supabase SQL Editor to set up the tables.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. business_profile
create table if not exists business_profile (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  description text,
  services text[],
  target_monthly_revenue numeric default 6000,
  current_monthly_revenue numeric default 0,
  primary_offer text,
  secondary_offer text,
  target_markets text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. goals
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
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

-- 3. offers
create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
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

-- 4. leads
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text,
  industry text,
  website text,
  email text,
  phone text,
  social_link text,
  location text,
  pain_point text,
  lead_score numeric,
  status text default 'New',
  source text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. lead_scores
create table if not exists lead_scores (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  website_score numeric,
  branding_score numeric,
  automation_need_score numeric,
  ability_to_pay_score numeric,
  urgency_score numeric,
  total_score numeric,
  reasoning text,
  created_at timestamptz default now()
);

-- 6. outreach_messages
create table if not exists outreach_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  channel text,
  message text not null,
  status text default 'Draft',
  approval_status text default 'Pending Approval',
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- 7. followups
create table if not exists followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  followup_date date,
  followup_type text,
  message text,
  status text default 'Pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. proposals
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete set null,
  client_id uuid,
  title text,
  problem text,
  solution text,
  deliverables text[],
  timeline text,
  price numeric,
  payment_terms text,
  status text default 'Draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. clients
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
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

-- 10. projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
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

-- 11. tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  agent_name text,
  title text not null,
  description text,
  priority text default 'Medium',
  status text default 'Pending',
  due_date date,
  result text,
  related_goal_id uuid references goals(id) on delete set null,
  related_lead_id uuid references leads(id) on delete set null,
  related_client_id uuid references clients(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 12. revenue
create table if not exists revenue (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  proposal_id uuid references proposals(id) on delete set null,
  amount numeric not null,
  type text default 'Project',
  status text default 'Expected',
  payment_date date,
  month text,
  notes text,
  created_at timestamptz default now()
);

-- 13. memories
create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  type text,
  content text not null,
  tags text[],
  importance numeric default 5,
  source text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 14. agent_logs
create table if not exists agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_name text,
  action text,
  input jsonb,
  output jsonb,
  status text,
  created_at timestamptz default now()
);

-- 15. daily_reports
create table if not exists daily_reports (
  id uuid primary key default gen_random_uuid(),
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

-- Enable RLS for Security Readiness (RLS is off by default for MVP convenience)
alter table business_profile enable row level security;
alter table goals enable row level security;
alter table offers enable row level security;
alter table leads enable row level security;
alter table lead_scores enable row level security;
alter table outreach_messages enable row level security;
alter table followups enable row level security;
alter table proposals enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table revenue enable row level security;
alter table memories enable row level security;
alter table agent_logs enable row level security;
alter table daily_reports enable row level security;

-- 16. expenses
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  amount numeric not null,
  category text not null,
  date date not null,
  notes text,
  created_at timestamptz default now()
);

-- 17. tool_logs
create table if not exists tool_logs (
  id uuid primary key default gen_random_uuid(),
  tool_name text not null,
  action text not null,
  input text,
  output text,
  status text default 'Success',
  error text,
  created_at timestamptz default now()
);

-- 18. content_ideas
create table if not exists content_ideas (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  title text not null,
  hook text,
  content text,
  content_type text,
  status text default 'Idea',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 19. ad_campaigns
create table if not exists ad_campaigns (
  id uuid primary key default gen_random_uuid(),
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

-- 20. community_metrics
create table if not exists community_metrics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  platform text,
  value text not null,
  change numeric default 0,
  trend text default 'neutral',
  created_at timestamptz default now()
);

alter table expenses enable row level security;
alter table tool_logs enable row level security;
alter table content_ideas enable row level security;
alter table ad_campaigns enable row level security;
alter table community_metrics enable row level security;

-- Create Open Public Access Policies for MVP (Can be tightened later with Auth)
create policy "Public Access Profile" on business_profile for all using (true) with check (true);
create policy "Public Access Goals" on goals for all using (true) with check (true);
create policy "Public Access Offers" on offers for all using (true) with check (true);
create policy "Public Access Leads" on leads for all using (true) with check (true);
create policy "Public Access Lead Scores" on lead_scores for all using (true) with check (true);
create policy "Public Access Outreach" on outreach_messages for all using (true) with check (true);
create policy "Public Access Followups" on followups for all using (true) with check (true);
create policy "Public Access Proposals" on proposals for all using (true) with check (true);
create policy "Public Access Clients" on clients for all using (true) with check (true);
create policy "Public Access Projects" on projects for all using (true) with check (true);
create policy "Public Access Tasks" on tasks for all using (true) with check (true);
create policy "Public Access Revenue" on revenue for all using (true) with check (true);
create policy "Public Access Memories" on memories for all using (true) with check (true);
create policy "Public Access Agent Logs" on agent_logs for all using (true) with check (true);
create policy "Public Access Daily Reports" on daily_reports for all using (true) with check (true);
create policy "Public Access Expenses" on expenses for all using (true) with check (true);
create policy "Public Access Tool Logs" on tool_logs for all using (true) with check (true);
create policy "Public Access Content Ideas" on content_ideas for all using (true) with check (true);
create policy "Public Access Ad Campaigns" on ad_campaigns for all using (true) with check (true);
create policy "Public Access Community Metrics" on community_metrics for all using (true) with check (true);


