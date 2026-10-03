import type { Task } from '../types';
import { supabase, getUserId, safeRead, safeWrite } from './_core';

export async function getTasks(): Promise<Task[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data || [];
  }, [], 'getTasks');
}

export async function addTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, 'addTask');
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, 'updateTask');
}

export async function deleteTask(id: string): Promise<boolean> {
  return safeWrite(async () => {
    const userId = await getUserId();
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    return !error;
  }, 'deleteTask');
}
