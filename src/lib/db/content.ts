import type { ContentIdea, DailyReport } from '../types';
import { supabase, getUserId, safeRead, safeWrite } from './_core';

export async function getContentIdeas(): Promise<ContentIdea[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('content_ideas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, [], 'getContentIdeas');
}

export async function addContentIdea(idea: Omit<ContentIdea, 'id' | 'created_at' | 'updated_at'>): Promise<ContentIdea> {
  const fallbackIdea: ContentIdea = {
    id: 'mock-idea-' + Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...idea
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('content_ideas')
      .insert({ ...idea, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, fallbackIdea, 'addContentIdea');
}

export async function updateContentIdea(id: string, updates: Partial<ContentIdea>): Promise<ContentIdea> {
  const fallbackIdea: ContentIdea = {
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    platform: updates.platform || 'LinkedIn',
    title: updates.title || '',
    hook: updates.hook || '',
    content: updates.content || '',
    content_type: updates.content_type || 'Text',
    status: updates.status || 'Draft',
    user_id: 'demo-user',
    ...updates
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('content_ideas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, fallbackIdea, 'updateContentIdea');
}

export async function getDailyReports(): Promise<DailyReport[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', userId)
      .order('report_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }, [], 'getDailyReports');
}

export async function addDailyReport(report: Omit<DailyReport, 'id' | 'created_at'>): Promise<DailyReport> {
  const fallbackReport: DailyReport = {
    id: 'mock-rep-' + Date.now(),
    created_at: new Date().toISOString(),
    ...report
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('daily_reports')
      .insert({ ...report, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, fallbackReport, 'addDailyReport');
}
