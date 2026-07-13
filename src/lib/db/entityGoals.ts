import type { EntityGoal } from '../types';
import { supabase, getUserId, safeRead, safeWrite } from './_core';

export async function getEntityGoals(filter?: { period?: string; level?: string; status?: string }): Promise<EntityGoal[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    let q = supabase
      .from('entity_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (filter?.period) q = q.eq('period', filter.period);
    if (filter?.level) q = q.eq('level', filter.level);
    if (filter?.status) q = q.eq('status', filter.status);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }, [], 'getEntityGoals');
}

export async function addEntityGoal(
  goal: Omit<EntityGoal, 'id' | 'created_at' | 'status'> & { status?: EntityGoal['status'] }
): Promise<EntityGoal> {
  const fallback: EntityGoal = {
    id: 'mock-goal-' + Date.now(),
    created_at: new Date().toISOString(),
    status: 'draft',
    ...goal,
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('entity_goals')
      .insert({ status: 'draft', ...goal, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, fallback, 'addEntityGoal');
}

export async function updateEntityGoal(id: string, updates: Partial<EntityGoal>): Promise<EntityGoal | null> {
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('entity_goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, null, 'updateEntityGoal');
}
