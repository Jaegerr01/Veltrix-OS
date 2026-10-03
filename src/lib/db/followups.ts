import type { Followup } from '../types';
import { supabase, getUserId, safeRead, safeWrite, withOptionalColumns, assertTruthfulSent } from './_core';

const OPTIONAL_COLS = ['provider', 'provider_message_id', 'error', 'attempts', 'sent_at'];

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
  assertTruthfulSent('followups', fup);
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await withOptionalColumns({ ...fup, user_id: userId }, OPTIONAL_COLS, p =>
      supabase.from('followups').insert(p).select().single()
    );
    if (error) throw error;
    return data;
  }, 'addFollowup');
}

export async function updateFollowup(id: string, updates: Partial<Followup>): Promise<Followup> {
  assertTruthfulSent('followups', updates);
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await withOptionalColumns({ ...updates, updated_at: new Date().toISOString() }, OPTIONAL_COLS, p =>
      supabase.from('followups').update(p).eq('id', id).eq('user_id', userId).select().single()
    );
    if (error) throw error;
    return data;
  }, 'updateFollowup');
}
