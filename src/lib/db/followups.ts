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
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('followups')
      .insert({ ...fup, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, 'addFollowup');
}

export async function updateFollowup(id: string, updates: Partial<Followup>): Promise<Followup> {
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
  }, 'updateFollowup');
}
