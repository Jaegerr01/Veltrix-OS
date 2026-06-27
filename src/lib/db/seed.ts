import * as seedData from '../seedData';
import { supabase, getUserId } from './_core';
import { getBusinessProfile, syncBusinessProfileToMemory, syncGoalToMemory } from './profile';
import { syncClientToMemory } from './clients';
import { addMemory } from './memory';

async function seedDemoDataForUser(userId: string) {
  // Sync Profile
  try {
    const profile = await getBusinessProfile();
    if (profile) {
      await syncBusinessProfileToMemory(profile);
    }
  } catch (profileErr) {
    console.error('Failed to seed business profile or sync it:', profileErr);
  }

  // 1. Goals
  const goals = seedData.defaultGoals.map(g => ({
    title: g.title,
    description: g.description,
    target_amount: g.target_amount,
    status: g.status,
    priority: g.priority,
    deadline: g.deadline,
    success_criteria: g.success_criteria,
    user_id: userId
  }));
  const { data: insertedGoals } = await supabase.from('goals').insert(goals).select();
  if (insertedGoals) {
    for (const g of insertedGoals) {
      try {
        await syncGoalToMemory(g);
      } catch (err) {
        console.error('Failed to sync goal to memory during seeding:', err);
      }
    }
  }

  // 2. Leads
  const leads = seedData.defaultLeads.map(l => ({
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
    notes: l.notes,
    user_id: userId
  }));
  await supabase.from('leads').insert(leads);

  // 3. Clients & Revenue
  const { data: insertedClient } = await supabase.from('clients').insert({
    business_name: 'Metro Real Estate Group',
    contact_name: 'John Broker',
    email: 'john@metrorealtyex.com',
    phone: '555-0198',
    website: 'http://metrorealtyex.com',
    service_purchased: 'AI Website + Brand System',
    total_value: 1500.00,
    monthly_retainer: 0.00,
    status: 'Active',
    user_id: userId
  }).select().single();

  if (insertedClient) {
    try {
      await syncClientToMemory(insertedClient);
    } catch (err) {
      console.error('Failed to sync client to memory during seeding:', err);
    }

    await supabase.from('revenue').insert({
      client_id: insertedClient.id,
      amount: 1500.00,
      type: 'Project',
      status: 'Paid',
      payment_date: '2026-05-15',
      month: '2026-05',
      notes: 'Initial website setup client',
      user_id: userId
    });
  }

  // 4. Tasks
  const tasks = seedData.defaultTasks.map(t => ({
    agent_name: t.agent_name,
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: t.status,
    due_date: t.due_date,
    user_id: userId
  }));
  await supabase.from('tasks').insert(tasks);

  // 5. Notes (Memories)
  for (const m of seedData.defaultMemories) {
    try {
      await addMemory({
        type: m.type,
        content: m.content,
        tags: m.tags,
        importance: m.importance,
        source: m.source
      });
    } catch (err) {
      console.error('Failed to seed memory to notes table:', err);
    }
  }

  // 6. Daily Reports
  const dailyReports = seedData.defaultDailyReports.map(r => ({
    report_date: r.report_date,
    revenue_target: r.revenue_target,
    closed_revenue: r.closed_revenue,
    pipeline_value: r.pipeline_value,
    revenue_gap: r.revenue_gap,
    top_priority: r.top_priority,
    leads_to_contact: r.leads_to_contact,
    followups_due: r.followups_due,
    content_to_post: r.content_to_post,
    recommended_action: r.recommended_action,
    user_id: userId
  }));
  await supabase.from('daily_reports').insert(dailyReports);

  // 7. Content Ideas
  const contentIdeas = seedData.defaultContentIdeas.map(c => ({
    platform: c.platform,
    title: c.title,
    hook: c.hook,
    content: c.content,
    content_type: c.content_type,
    status: c.status,
    user_id: userId
  }));
  await supabase.from('content_ideas').insert(contentIdeas);

  // 8. Initial Chat Message
  await supabase.from('activities').insert({
    user_id: userId,
    type: 'system',
    actor: 'CEO Agent',
    action: 'chat_message',
    output: 'Demo mode initialized. VELTRIX COMMAND OS is loaded with sample leads, transaction histories, and tasks.'
  });
}

export async function resetDatabase(mode: 'clean' | 'demo'): Promise<void> {
  const userId = await getUserId();

  // Cascade wipes
  await supabase.from('lead_scores').delete().eq('user_id', userId);
  await supabase.from('outreach_messages').delete().eq('user_id', userId);
  await supabase.from('followups').delete().eq('user_id', userId);
  await supabase.from('proposals').delete().eq('user_id', userId);
  await supabase.from('tasks').delete().eq('user_id', userId);
  await supabase.from('revenue').delete().eq('user_id', userId);
  await supabase.from('expenses').delete().eq('user_id', userId);
  await supabase.from('projects').delete().eq('user_id', userId);
  await supabase.from('leads').delete().eq('user_id', userId);
  await supabase.from('clients').delete().eq('user_id', userId);
  await supabase.from('activities').delete().eq('user_id', userId);
  await supabase.from('notes').delete().eq('user_id', userId);
  await supabase.from('agent_memory').delete().eq('user_id', userId);
  await supabase.from('goals').delete().eq('user_id', userId);
  await supabase.from('offers').delete().eq('user_id', userId);
  await supabase.from('daily_reports').delete().eq('user_id', userId);
  await supabase.from('content_ideas').delete().eq('user_id', userId);
  await supabase.from('ad_campaigns').delete().eq('user_id', userId);
  await supabase.from('community_metrics').delete().eq('user_id', userId);

  if (mode === 'demo') {
    await seedDemoDataForUser(userId);
  }
}
