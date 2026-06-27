import type { Lead, LeadScore } from '../types';
import { supabase, getUserId, safeRead, safeWrite } from './_core';

export async function getLeads(): Promise<Lead[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('lead_score', { ascending: false });
    if (error) throw error;
    return data || [];
  }, [], 'getLeads');
}

export async function addLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
  const fallbackLead: Lead = {
    id: 'mock-lead-' + Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business_name: lead.business_name,
    contact_name: lead.contact_name || '',
    industry: lead.industry || '',
    website: lead.website || '',
    email: lead.email || '',
    phone: lead.phone || '',
    social_link: lead.social_link || '',
    location: lead.location || '',
    pain_point: lead.pain_point || '',
    lead_score: lead.lead_score || 0,
    status: lead.status || 'New',
    source: lead.source || 'Manual',
    notes: lead.notes || '',
    user_id: 'demo-user'
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('leads')
      .insert({ ...lead, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, fallbackLead, 'addLead');
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const fallbackLead: Lead = {
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business_name: updates.business_name || '',
    contact_name: updates.contact_name || '',
    industry: updates.industry || '',
    website: updates.website || '',
    email: updates.email || '',
    phone: updates.phone || '',
    social_link: updates.social_link || '',
    location: updates.location || '',
    pain_point: updates.pain_point || '',
    lead_score: updates.lead_score || 0,
    status: updates.status || 'New',
    source: updates.source || 'Manual',
    notes: updates.notes || '',
    user_id: 'demo-user',
    ...updates
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, fallbackLead, 'updateLead');
}

export async function deleteLead(id: string): Promise<boolean> {
  return safeWrite(async () => {
    const userId = await getUserId();
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    return !error;
  }, false, 'deleteLead');
}

export async function getLeadScores(leadId?: string): Promise<LeadScore[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    let q = supabase.from('lead_scores').select('*').eq('user_id', userId);
    if (leadId) q = q.eq('lead_id', leadId);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, [], 'getLeadScores');
}

export async function addLeadScore(score: Omit<LeadScore, 'id' | 'created_at'>): Promise<LeadScore> {
  const fallbackScore: LeadScore = {
    id: 'mock-score-' + Date.now(),
    created_at: new Date().toISOString(),
    lead_id: score.lead_id,
    website_score: score.website_score || 0,
    branding_score: score.branding_score || 0,
    automation_need_score: score.automation_need_score || 0,
    ability_to_pay_score: score.ability_to_pay_score || 0,
    urgency_score: score.urgency_score || 0,
    total_score: score.total_score || 0,
    reasoning: score.reasoning || '',
    user_id: 'demo-user'
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('lead_scores')
      .insert({ ...score, user_id: userId })
      .select()
      .single();
    if (error) throw error;

    // Sync total score inside lead record
    try {
      await supabase
        .from('leads')
        .update({ lead_score: score.total_score, status: 'Researched' })
        .eq('id', score.lead_id)
        .eq('user_id', userId);
    } catch (err) {
      console.warn('Failed to update lead score in lead record:', err);
    }

    return data;
  }, fallbackScore, 'addLeadScore');
}
