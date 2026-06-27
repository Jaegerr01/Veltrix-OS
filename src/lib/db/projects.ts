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
  const fallbackProject: Project = {
    id: 'mock-project-' + Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client_id: project.client_id,
    project_name: project.project_name,
    service_type: project.service_type || 'Website Development',
    status: project.status || 'Discovery',
    deadline: project.deadline || '',
    requirements: project.requirements || '',
    deliverables: project.deliverables || [],
    revision_count: project.revision_count || 0,
    notes: project.notes || '',
    user_id: 'demo-user'
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...project, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, fallbackProject, 'addProject');
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  const fallbackProject: Project = {
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client_id: updates.client_id || '',
    project_name: updates.project_name || '',
    service_type: updates.service_type || 'Website Development',
    status: updates.status || 'Discovery',
    deadline: updates.deadline || '',
    requirements: updates.requirements || '',
    deliverables: updates.deliverables || [],
    revision_count: updates.revision_count || 0,
    notes: updates.notes || '',
    user_id: 'demo-user',
    ...updates
  };
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
  }, fallbackProject, 'updateProject');
}
