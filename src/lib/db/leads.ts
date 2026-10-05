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
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('leads')
      .insert({ ...lead, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, 'addLead');
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
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
  }, 'updateLead');
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
  }, 'deleteLead');
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
  }, 'addLeadScore');
}
