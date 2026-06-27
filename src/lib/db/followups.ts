import type { Followup } from '../types';
import { supabase, getUserId, safeRead, safeWrite } from './_core';

export async function getFollowups(leadId?: string): Promise<Followup[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    let q = supabase.from('followups').select('*').eq('user_id', userId);
    if (leadId) q = q.eq('lead_id', leadId);
    const { data, error } = await q.order('followup_date', { ascending: true });
    if (error) throw error;
    return data || [];
  }, [], 'getFollowups');
}

export async function addFollowup(fup: Omit<Followup, 'id' | 'created_at' | 'updated_at'>): Promise<Followup> {
  const fallbackFup: Followup = {
    id: 'mock-fup-' + Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lead_id: fup.lead_id,
    followup_date: fup.followup_date,
    followup_type: fup.followup_type,
    status: fup.status || 'Pending',
    message: fup.message || '',
    user_id: 'demo-user'
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('followups')
      .insert({ ...fup, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, fallbackFup, 'addFollowup');
}

export async function updateFollowup(id: string, updates: Partial<Followup>): Promise<Followup> {
  const fallbackFup: Followup = {
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lead_id: updates.lead_id || '',
    followup_date: updates.followup_date || '',
    followup_type: updates.followup_type || 'Soft Reminder',
    status: updates.status || 'Pending',
    message: updates.message || '',
    user_id: 'demo-user',
    ...updates
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('followups')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, fallbackFup, 'updateFollowup');
}
