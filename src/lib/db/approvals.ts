import type { ApprovalRequest } from '../types';
import { supabase, getUserId, safeRead, safeWrite } from './_core';

export async function getApprovalRequests(status?: string): Promise<ApprovalRequest[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    let query = supabase
      .from('approval_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }, [], 'getApprovalRequests');
}

export async function addApprovalRequest(
  req: Omit<ApprovalRequest, 'id' | 'created_at' | 'status'> & { status?: ApprovalRequest['status'] }
): Promise<ApprovalRequest> {
  const fallback: ApprovalRequest = {
    id: 'mock-approval-' + Date.now(),
    created_at: new Date().toISOString(),
    status: 'pending',
    ...req,
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('approval_requests')
      .insert({ status: 'pending', ...req, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, fallback, 'addApprovalRequest');
}

export async function updateApprovalRequest(
  id: string,
  updates: Partial<ApprovalRequest>
): Promise<ApprovalRequest | null> {
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('approval_requests')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, null, 'updateApprovalRequest');
}
