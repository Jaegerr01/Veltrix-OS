import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import * as seed from '../seedData';

// Parse .env.local manually to read secret keys
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const getCleanSupabaseUrl = (rawUrl: string) => {
  let url = rawUrl || '';
  if (url.includes('supabase.com/dashboard/project/')) {
    const parts = url.trim().split('/');
    const ref = parts[parts.length - 1];
    url = `https://${ref}.supabase.co`;
  }
  return url;
};

const supabaseUrl = getCleanSupabaseUrl(env['NEXT_PUBLIC_SUPABASE_URL']);
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Supabase URL or service role key is missing in .env.local!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// UUID mapping directory to handle relationships
const uuidMap: Record<string, string> = {};

const childTables = [
  'tasks',
  'revenue',
  'projects',
  'proposals',
  'lead_scores',
  'outreach_messages',
  'followups',
  'expenses',
  'ad_campaigns',
  'community_metrics',
  'activities',
  'agent_memory'
];

const parentTables = [
  'clients',
  'leads',
  'goals',
  'offers',
  'profiles',
  'notes',
  'daily_reports'
];

async function clearTable(tableName: string) {
  console.log(`Clearing table [${tableName}]...`);
  try {
    const { error } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log(`ℹ️ Table [${tableName}] does not exist. Skipping clear.`);
      } else {
        console.warn(`⚠️ Error clearing [${tableName}]: ${error.message}`);
      }
    } else {
      console.log(`✅ Table [${tableName}] cleared.`);
    }
  } catch (e: any) {
    console.error(`❌ Unexpected error clearing [${tableName}]:`, e.message);
  }
}

async function seedTable(tableName: string, data: any[]) {
  console.log(`Seeding table [${tableName}]...`);
  try {
    const { data: inserted, error: insertError } = await supabase
      .from(tableName)
      .insert(data)
      .select();

    if (insertError) {
      if (insertError.message.includes('relation') && insertError.message.includes('does not exist')) {
        console.log(`⚠️ Skip [${tableName}]: Table does not exist in schema.`);
      } else {
        console.error(`❌ Error seeding table [${tableName}]:`, insertError.message);
      }
    } else {
      console.log(`✅ Table [${tableName}] seeded successfully. Inserted ${inserted?.length} records.`);
    }
  } catch (e: any) {
    console.error(`❌ Unexpected error on table [${tableName}]:`, e.message);
  }
}

async function run() {
  console.log('🚀 Resetting & Seeding Supabase database...');
  
  // 1. Fetch existing users from auth.users
  console.log('Fetching auth users...');
  const { data: authUsers, error: listUsersError } = await supabase.auth.admin.listUsers();
  if (listUsersError) {
    console.error('❌ Failed to fetch auth users:', listUsersError.message);
    process.exit(1);
  }

  let usersToSeed = authUsers?.users || [];
  if (usersToSeed.length === 0) {
    console.log('No users found in auth.users. Creating default test user...');
    const { data: defaultUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'test-vector-operator@veltrix.os',
      password: 'VeltrixVectorPassword123!',
      email_confirm: true
    });
    if (createError) {
      console.error('❌ Failed to create default test user:', createError.message);
      process.exit(1);
    }
    if (defaultUser?.user) {
      usersToSeed = [defaultUser.user];
      console.log('✅ Default test user created:', defaultUser.user.email);
    }
  }

  // 2. Ensure all auth users exist in public.users table
  console.log('Synchronizing public.users...');
  for (const user of usersToSeed) {
    const { error: userInsertError } = await supabase
      .from('users')
      .upsert({ id: user.id, email: user.email || '' });
    if (userInsertError) {
      console.error(`❌ Failed to sync user ${user.email} into public.users:`, userInsertError.message);
      process.exit(1);
    }
  }
  console.log('✅ Users synced successfully.');

  // 3. Clear tables (children first, then parents)
  for (const table of childTables) {
    await clearTable(table);
  }
  for (const table of parentTables) {
    await clearTable(table);
  }

  // 4. Seed tables per user
  for (const user of usersToSeed) {
    console.log(`\n👤 Seeding data for user: ${user.email} (${user.id})...`);

    const mapId = (mockId: string | undefined | null): string => {
      if (!mockId) return '';
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mockId)) {
        return mockId;
      }
      const key = `${mockId}-${user.id}`;
      if (!uuidMap[key]) {
        uuidMap[key] = crypto.randomUUID();
      }
      return uuidMap[key];
    };

    const mapNullableId = (mockId: string | undefined | null): string | null => {
      if (!mockId) return null;
      return mapId(mockId);
    };

    // Profiles
    console.log('Seeding Profile...');
    const bpProfile = {
      id: user.id,
      business_name: seed.defaultBusinessProfile.business_name,
      description: seed.defaultBusinessProfile.description,
      services: seed.defaultBusinessProfile.services,
      target_monthly_revenue: seed.defaultBusinessProfile.target_monthly_revenue,
      current_monthly_revenue: seed.defaultBusinessProfile.current_monthly_revenue,
      primary_offer: seed.defaultBusinessProfile.primary_offer,
      secondary_offer: seed.defaultBusinessProfile.secondary_offer,
      target_markets: seed.defaultBusinessProfile.target_markets,
      autopilot: seed.defaultBusinessProfile.autopilot
    };
    const { error: profileError } = await supabase.from('profiles').insert(bpProfile);
    if (profileError) {
      console.error(`❌ Profile seed error for ${user.email}:`, profileError.message);
    } else {
      console.log(`✅ Profile seeded for ${user.email}.`);
    }

    // Goals
    const goals = seed.defaultGoals.map(g => ({
      id: mapId(g.id),
      user_id: user.id,
      title: g.title,
      description: g.description,
      target_amount: g.target_amount,
      status: g.status,
      priority: g.priority,
      deadline: g.deadline,
      success_criteria: g.success_criteria
    }));
    await seedTable('goals', goals);

    // Offers
    const offers = seed.defaultOffers.map(o => ({
      id: mapId(o.id),
      user_id: user.id,
      name: o.name,
      description: o.description,
      target_customer: o.target_customer,
      price_min: o.price_min,
      price_max: o.price_max,
      monthly_retainer_min: o.monthly_retainer_min,
      monthly_retainer_max: o.monthly_retainer_max,
      deliverables: o.deliverables,
      status: o.status
    }));
    await seedTable('offers', offers);

    // Leads
    const leads = seed.defaultLeads.map(l => ({
      id: mapId(l.id),
      user_id: user.id,
      business_name: l.business_name,
      contact_name: l.contact_name,
      industry: l.industry,
      website: l.website,
      email: l.email,
      phone: l.phone,
      social_link: l.social_link,
      location: l.location,
      pain_point: l.pain_point,
      lead_score: l.lead_score,
      status: l.status,
      source: l.source,
      notes: l.notes
    }));
    await seedTable('leads', leads);

    // Clients
    const defaultClients = [
      {
        id: mapId('c-seed-1'),
        user_id: user.id,
        business_name: 'Metro Real Estate Group',
        contact_name: 'John Broker',
        email: 'john@metrorealtyex.com',
        phone: '555-0198',
        website: 'http://metrorealtyex.com',
        service_purchased: 'AI Website + Brand System',
        total_value: 1500.00,
        monthly_retainer: 0.00,
        status: 'Active'
      }
    ];
    await seedTable('clients', defaultClients);

    // Tasks
    const tasks = seed.defaultTasks.map(t => ({
      id: mapId(t.id),
      user_id: user.id,
      agent_name: t.agent_name,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date,
      related_goal_id: mapNullableId(t.related_goal_id),
      related_lead_id: mapNullableId(t.related_lead_id),
      related_client_id: mapNullableId(t.related_client_id)
    }));
    await seedTable('tasks', tasks);

    // Notes (Memories)
    const notes = seed.defaultMemories.map(m => ({
      id: mapId(m.id),
      user_id: user.id,
      title: m.type + ' Note',
      content: m.content,
      tags: m.tags,
      importance: m.importance,
      source: m.source
    }));
    await seedTable('notes', notes);

    // Daily Reports
    const dailyReports = seed.defaultDailyReports.map(r => ({
      id: mapId(r.id),
      user_id: user.id,
      report_date: r.report_date,
      revenue_target: r.revenue_target,
      closed_revenue: r.closed_revenue,
      pipeline_value: r.pipeline_value,
      revenue_gap: r.revenue_gap,
      top_priority: r.top_priority,
      leads_to_contact: r.leads_to_contact,
      followups_due: r.followups_due,
      content_to_post: r.content_to_post,
      recommended_action: r.recommended_action
    }));
    await seedTable('daily_reports', dailyReports);

    // Content Ideas
    const contentIdeas = seed.defaultContentIdeas.map(c => ({
      id: mapId(c.id),
      user_id: user.id,
      platform: c.platform,
      title: c.title,
      hook: c.hook,
      content: c.content,
      content_type: c.content_type,
      status: c.status
    }));
    await seedTable('content_ideas', contentIdeas);

    // Revenue
    const defaultRevenues = [
      {
        id: mapId('rev-seed-1'),
        user_id: user.id,
        client_id: mapNullableId('c-seed-1'),
        amount: 1500.00,
        type: 'Project',
        status: 'Paid',
        payment_date: '2026-05-15',
        month: '2026-05',
        notes: 'Initial website setup client'
      }
    ];
    await seedTable('revenue', defaultRevenues);

    // Expenses
    const defaultExpenses = [
      {
        id: mapId('exp-seed-1'),
        user_id: user.id,
        title: 'Gemini API Credits',
        amount: 35.00,
        category: 'Software',
        date: '2026-05-20',
        notes: 'AI Agent inference calls'
      }
    ];
    await seedTable('expenses', defaultExpenses);

    // Ad Campaigns
    const defaultAdCampaigns = [
      {
        id: mapId('ad-seed-1'),
        user_id: user.id,
        name: 'Futuristic AI Booking Assistant Launch',
        platform: 'LinkedIn Ads',
        status: 'Active',
        budget: 500.00,
        spent: 120.00,
        clicks: 340,
        impressions: 12400,
        conversions: 18
      },
      {
        id: mapId('ad-seed-2'),
        user_id: user.id,
        name: 'Local Business Automation System Promotion',
        platform: 'Google Search Ads',
        status: 'Draft',
        budget: 300.00,
        spent: 0.00,
        clicks: 0,
        impressions: 0,
        conversions: 0
      }
    ];
    await seedTable('ad_campaigns', defaultAdCampaigns);

    // Community Metrics
    const defaultCommunityMetrics = [
      {
        id: mapId('metric-seed-1'),
        user_id: user.id,
        name: 'Total LinkedIn Followers',
        platform: 'LinkedIn',
        value: '2,420',
        change: 12.5,
        trend: 'up'
      },
      {
        id: mapId('metric-seed-2'),
        user_id: user.id,
        name: 'Monthly Profile Impressions',
        platform: 'LinkedIn',
        value: '18,500',
        change: -4.2,
        trend: 'down'
      },
      {
        id: mapId('metric-seed-3'),
        user_id: user.id,
        name: 'Organic Lead Capture Conversion Rate',
        platform: 'Website',
        value: '4.8%',
        change: 0.5,
        trend: 'up'
      }
    ];
    await seedTable('community_metrics', defaultCommunityMetrics);

    // Initial Chat Message
    await supabase.from('activities').insert({
      user_id: user.id,
      type: 'system',
      actor: 'CEO Agent',
      action: 'chat_message',
      output: 'Demo mode initialized. VELTRIX COMMAND OS is loaded with sample leads, transaction histories, and tasks.'
    });
  }

  console.log('\n🏁 Seeding Process Complete!');
}

run();
