import type { OutreachMessage } from '../types';
import { supabase, getUserId, safeRead, safeWrite, withOptionalColumns, assertTruthfulSent } from './_core';

const OPTIONAL_COLS = ['provider', 'provider_message_id', 'error', 'attempts'];

export async function getOutreachMessages(leadId?: string): Promise<OutreachMessage[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    let q = supabase.from('outreach_messages').select('*').eq('user_id', userId);
    if (leadId) q = q.eq('lead_id', leadId);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, [], 'getOutreachMessages');
}

export async function addOutreachMessage(msg: Omit<OutreachMessage, 'id' | 'created_at'>): Promise<OutreachMessage> {
  assertTruthfulSent('outreach_messages', msg);
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await withOptionalColumns({ ...msg, user_id: userId }, OPTIONAL_COLS, p =>
      supabase.from('outreach_messages').insert(p).select().single()
    );
    if (error) throw error;
    return data;
  }, 'addOutreachMessage');
}

export async function updateOutreachMessage(id: string, updates: Partial<OutreachMessage>): Promise<OutreachMessage> {
  assertTruthfulSent('outreach_messages', updates);
  return safeWrite(async () => {
    const userId = await getUserId();
    // NOTE: this no longer touches the lead. A lead moves to 'Contacted' only inside
    // lib/email/delivery.ts, after the provider confirmed delivery.
    const { data, error } = await withOptionalColumns(updates, OPTIONAL_COLS, p =>
      supabase.from('outreach_messages').update(p).eq('id', id).eq('user_id', userId).select().single()
    );
    if (error) throw error;
    return data as OutreachMessage;
  }, 'updateOutreachMessage');
}
