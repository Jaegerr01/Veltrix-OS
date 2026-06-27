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
  const fallbackTask: Task = {
    id: 'mock-task-' + Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    agent_name: task.agent_name || 'Manual Task',
    title: task.title,
    description: task.description || '',
    priority: task.priority || 'Medium',
    status: task.status || 'Pending',
    due_date: task.due_date || '',
    related_client_id: task.related_client_id || '',
    user_id: 'demo-user'
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, fallbackTask, 'addTask');
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const fallbackTask: Task = {
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    agent_name: updates.agent_name || 'Manual Task',
    title: updates.title || '',
    description: updates.description || '',
    priority: updates.priority || 'Medium',
    status: updates.status || 'Pending',
    due_date: updates.due_date || '',
    related_client_id: updates.related_client_id || '',
    user_id: 'demo-user',
    ...updates
  };
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
  }, fallbackTask, 'updateTask');
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
  }, false, 'deleteTask');
}
