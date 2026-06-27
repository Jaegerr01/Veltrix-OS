import type { Memory } from '../types';
import { supabase, getUserId, safeRead, safeWrite } from './_core';

export async function getMemories(): Promise<Memory[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('importance', { ascending: false });

    if (error) throw error;

    return (data || []).map((note: any) => ({
      id: note.id,
      user_id: note.user_id,
      type: note.source === 'Delivery Manager Agent' || note.tags?.includes('autopilot') ? 'Decision' : 'Business',
      content: note.content,
      tags: note.tags || [],
      importance: note.importance || 5,
      source: note.source || 'Operator',
      created_at: note.created_at,
      updated_at: note.updated_at
    }));
  }, [], 'getMemories');
}

export async function addMemory(mem: Omit<Memory, 'id' | 'created_at' | 'updated_at'>): Promise<Memory> {
  const fallbackMemory: Memory = {
    id: 'mock-mem-' + Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...mem
  };
  return safeWrite<Memory>(async () => {
    const userId = await getUserId();
    let embedding: number[] | null = null;
    try {
      const { gemini } = await import('../ai/gemini');
      embedding = await gemini.getEmbedding(mem.content);
    } catch (embErr) {
      console.warn('Failed to generate embedding for note. Saving without embedding:', embErr);
    }

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title: mem.type + ' Note',
        content: mem.content,
        tags: mem.tags || [],
        importance: mem.importance || 5,
        source: mem.source || 'AI Agent',
        embedding: embedding
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      user_id: data.user_id,
      type: mem.type,
      content: data.content,
      tags: data.tags,
      importance: data.importance,
      source: data.source,
      created_at: data.created_at,
      updated_at: data.updated_at
    } as Memory;
  }, fallbackMemory, 'addMemory');
}

export async function searchMemories(query: string, limit: number = 5): Promise<Memory[]> {
  return safeRead(async () => {
    const userId = await getUserId();

    try {
      const { gemini } = await import('../ai/gemini');
      const embedding = await gemini.getEmbedding(query);

      const { data, error } = await supabase.rpc('match_notes', {
        query_embedding: embedding,
        match_threshold: 0.3,
        match_count: limit,
        p_user_id: userId
      });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        return data.map((note: any) => ({
          id: note.id,
          user_id: userId,
          type: 'Business',
          content: note.content,
          tags: note.tags || [],
          importance: note.importance || 5,
          source: 'Vector Search',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }
    } catch (vectorErr: any) {
      console.warn('Vector search failed, falling back to text search:', vectorErr.message || vectorErr);
    }

    // Fallback to text search
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .ilike('content', `%${query}%`)
      .limit(limit);

    if (error) throw error;

    return (data || []).map((note: any) => ({
      id: note.id,
      user_id: note.user_id,
      type: 'Business',
      content: note.content,
      tags: note.tags || [],
      importance: note.importance || 5,
      source: note.source || 'Search',
      created_at: note.created_at,
      updated_at: note.updated_at
    }));
  }, [], 'searchMemories');
}
