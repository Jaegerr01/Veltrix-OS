import type { Client } from '../types';
import { supabase, getUserId, safeRead, safeWrite } from './_core';
import { addMemory } from './memory';

export async function getClients(): Promise<Client[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, [], 'getClients');
}

export async function addClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
  const fallbackClient: Client = {
    id: 'mock-client-' + Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business_name: client.business_name,
    contact_name: client.contact_name || '',
    email: client.email || '',
    phone: client.phone || '',
    website: client.website || '',
    service_purchased: client.service_purchased || '',
    total_value: client.total_value || 0,
    monthly_retainer: client.monthly_retainer || 0,
    status: client.status || 'Active',
    user_id: 'demo-user'
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('clients')
      .insert({ ...client, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    try {
      await syncClientToMemory(data);
    } catch (err) {
      console.warn('Failed to sync client to memory:', err);
    }
    return data;
  }, fallbackClient, 'addClient');
}

export async function syncClientToMemory(client: Client): Promise<void> {
  try {
    const userId = await getUserId();
    const content = `Client Profile: ${client.business_name}. Contact Name: ${client.contact_name || 'N/A'}. Email: ${client.email || 'N/A'}. Phone: ${client.phone || 'N/A'}. Website: ${client.website || 'N/A'}. Service Purchased: ${client.service_purchased || 'N/A'}. Total Value: $${client.total_value || 0}. Monthly Retainer: $${client.monthly_retainer || 0}/mo. Status: ${client.status}.`;

    const { data: existing } = await supabase
      .from('notes')
      .select('id')
      .eq('user_id', userId)
      .contains('tags', [`client-${client.id}`])
      .maybeSingle();

    if (existing) {
      const { gemini } = await import('../ai/gemini');
      const embedding = await gemini.getEmbedding(content);
      await supabase
        .from('notes')
        .update({
          content,
          embedding,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await addMemory({
        type: 'Client',
        content,
        tags: [`client-${client.id}`, 'client', 'system-client'],
        importance: 8,
        source: 'System Sync'
      });
    }
  } catch (err) {
    console.error('Failed to sync client to memory:', err);
  }
}
