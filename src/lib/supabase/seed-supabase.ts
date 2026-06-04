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

function mapToUuid(mockId: string | undefined | null): string {
  if (!mockId) return '';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mockId)) {
    return mockId;
  }
  if (!uuidMap[mockId]) {
    uuidMap[mockId] = crypto.randomUUID();
  }
  return uuidMap[mockId];
}

function mapNullableToUuid(mockId: string | undefined | null): string | null {
  if (!mockId) return null;
  return mapToUuid(mockId);
}

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
  'community_metrics'
];


const parentTables = [
  'clients',
  'leads',
  'goals',
  'offers',
  'business_profile',
  'memories',
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
  
  // 1. Clear tables (children first, then parents)
  for (const table of childTables) {
    await clearTable(table);
  }
  for (const table of parentTables) {
    await clearTable(table);
  }

  console.log('\n📥 Seeding parent tables...');
  
  // Business Profile
  console.log('Seeding Business Profile...');
  const bpProfile = {
    ...seed.defaultBusinessProfile,
    id: mapToUuid(seed.defaultBusinessProfile.id)
  };
  const { data: bpData, error: bpError } = await supabase.from('business_profile').insert([bpProfile]).select();
  if (bpError) console.error('❌ Profile seed error:', bpError.message);
  else console.log('✅ Business Profile seeded.');

  // Goals
  const goals = seed.defaultGoals.map(g => ({
    ...g,
    id: mapToUuid(g.id)
  }));
  await seedTable('goals', goals);

  // Offers
  const offers = seed.defaultOffers.map(o => ({
    ...o,
    id: mapToUuid(o.id)
  }));
  await seedTable('offers', offers);

  // Leads
  const leads = seed.defaultLeads.map(l => ({
    ...l,
    id: mapToUuid(l.id)
  }));
  await seedTable('leads', leads);

  // Clients
  const defaultClients = [
    {
      id: mapToUuid('c-seed-1'),
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

  console.log('\n📥 Seeding child tables...');

  // Tasks
  const tasks = seed.defaultTasks.map(t => ({
    ...t,
    id: mapToUuid(t.id),
    related_goal_id: mapNullableToUuid(t.related_goal_id),
    related_lead_id: mapNullableToUuid(t.related_lead_id),
    related_client_id: mapNullableToUuid(t.related_client_id)
  }));
  await seedTable('tasks', tasks);

  // Memories
  const memories = seed.defaultMemories.map(m => ({
    ...m,
    id: mapToUuid(m.id)
  }));
  await seedTable('memories', memories);

  // Daily Reports
  const dailyReports = seed.defaultDailyReports.map(r => ({
    ...r,
    id: mapToUuid(r.id)
  }));
  await seedTable('daily_reports', dailyReports);

  // Content Ideas
  const contentIdeas = seed.defaultContentIdeas.map(c => ({
    ...c,
    id: mapToUuid(c.id)
  }));
  await seedTable('content_ideas', contentIdeas);

  // Revenue
  const defaultRevenues = [
    {
      id: mapToUuid('rev-seed-1'),
      client_id: mapNullableToUuid('c-seed-1'),
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
      id: mapToUuid('exp-seed-1'),
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
      id: mapToUuid('ad-seed-1'),
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
      id: mapToUuid('ad-seed-2'),
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
      id: mapToUuid('metric-seed-1'),
      name: 'Total LinkedIn Followers',
      platform: 'LinkedIn',
      value: '2,420',
      change: 12.5,
      trend: 'up'
    },
    {
      id: mapToUuid('metric-seed-2'),
      name: 'Monthly Profile Impressions',
      platform: 'LinkedIn',
      value: '18,500',
      change: -4.2,
      trend: 'down'
    },
    {
      id: mapToUuid('metric-seed-3'),
      name: 'Organic Lead Capture Conversion Rate',
      platform: 'Website',
      value: '4.8%',
      change: 0.5,
      trend: 'up'
    }
  ];
  await seedTable('community_metrics', defaultCommunityMetrics);

  console.log('\n🏁 Seeding Process Complete!');
}

run();
