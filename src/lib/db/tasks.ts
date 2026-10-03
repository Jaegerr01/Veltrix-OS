import type { Task } from '../types';
import { supabase, getUserId, safeRead, safeWrite, withOptionalColumns } from './_core';

// Orchestration columns (migrations/2026-10-02_003_task_orchestration.sql). Writes still work before it is applied.
const OPTIONAL_COLS = ['run_id', 'depends_on', 'requires_approval', 'approval_request_id', 'error', 'started_at', 'finished_at', 'created_by', 'agent_key', 'params'];

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
    const { data, error } = await withOptionalColumns({ ...task, user_id: userId }, OPTIONAL_COLS, p =>
      supabase.from('tasks').insert(p).select().single()
    );
    if (error) throw error;
    return data;
  }, 'addTask');
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await withOptionalColumns({ ...updates, updated_at: new Date().toISOString() }, OPTIONAL_COLS, p =>
      supabase.from('tasks').update(p).eq('id', id).eq('user_id', userId).select().single()
    );
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
