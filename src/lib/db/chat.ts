import type { ChatMessage } from '../types';
import { supabase, getUserId, safeRead, safeWrite } from './_core';

export async function getChatMessages(): Promise<ChatMessage[]> {
  const fallbackMessages = [
    {
      id: 'msg-start-1',
      sender: 'ai' as const,
      agentName: 'CEO Agent',
      message: 'VELTRIX COMMAND OS Initialized. I am your AI Chief of Staff. What is our focus today?',
      created_at: new Date().toISOString()
    }
  ];
  return safeRead(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'system')
      .eq('action', 'chat_message')
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return fallbackMessages;
    }

    return data.map((act: any) => ({
      id: act.id,
      sender: act.actor === 'Operator' ? 'user' : 'ai',
      agentName: act.actor === 'Operator' ? undefined : act.actor,
      message: act.output || '',
      created_at: act.created_at
    }));
  }, fallbackMessages, 'getChatMessages');
}

export async function addChatMessage(msg: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
  const fallbackMessage: ChatMessage = {
    id: 'mock-msg-' + Date.now(),
    sender: msg.sender,
    agentName: msg.agentName,
    message: msg.message,
    created_at: new Date().toISOString()
  };
  return safeWrite<ChatMessage>(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: userId,
        type: 'system',
        actor: msg.sender === 'user' ? 'Operator' : (msg.agentName || 'CEO Agent'),
        action: 'chat_message',
        output: msg.message
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      sender: data.actor === 'Operator' ? 'user' : 'ai',
      agentName: data.actor === 'Operator' ? undefined : data.actor,
      message: data.output || '',
      created_at: data.created_at
    };
  }, fallbackMessage, 'addChatMessage');
}

export async function clearChatMessages(): Promise<void> {
  await safeWrite(async () => {
    const userId = await getUserId();
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('user_id', userId)
      .eq('type', 'system')
      .eq('action', 'chat_message');
    if (error) throw error;
  }, undefined, 'clearChatMessages');
}
