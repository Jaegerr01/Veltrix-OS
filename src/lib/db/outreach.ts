import type { OutreachMessage } from '../types';
import { supabase, getUserId, safeRead, safeWrite } from './_core';

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
  const fallbackMsg: OutreachMessage = {
    id: 'mock-msg-' + Date.now(),
    created_at: new Date().toISOString(),
    lead_id: msg.lead_id,
    channel: msg.channel,
    message: msg.message,
    status: msg.status || 'Draft',
    approval_status: msg.approval_status || 'Pending Approval',
    user_id: 'demo-user'
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('outreach_messages')
      .insert({ ...msg, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, fallbackMsg, 'addOutreachMessage');
}

export async function updateOutreachMessage(id: string, updates: Partial<OutreachMessage>): Promise<OutreachMessage> {
  const fallbackMsg: OutreachMessage = {
    id,
    created_at: new Date().toISOString(),
    lead_id: updates.lead_id || '',
    channel: updates.channel || 'Email',
    message: updates.message || '',
    status: updates.status || 'Draft',
    approval_status: updates.approval_status || 'Pending Approval',
    user_id: 'demo-user',
    ...updates
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('outreach_messages')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;

    // Sync CRM lead status
    if (updates.status === 'Sent') {
      try {
        await supabase
          .from('leads')
          .update({ status: 'Contacted' })
          .eq('id', data.lead_id)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Failed to update lead status during message update:', err);
      }
    }
    return data;
  }, fallbackMsg, 'updateOutreachMessage');
}
