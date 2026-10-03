import type { Project } from '../types';
import { supabase, getUserId, safeRead, safeWrite } from './_core';

export async function getProjects(): Promise<Project[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('deadline', { ascending: true });
    if (error) throw error;
    return data || [];
  }, [], 'getProjects');
}

export async function addProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...project, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, 'addProject');
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, 'updateProject');
}
