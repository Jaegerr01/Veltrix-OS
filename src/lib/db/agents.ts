import type { AgentLog, ToolLog } from '../types';
import { supabase, getUserId, safeRead, safeWrite } from './_core';

export async function getAgentLogs(): Promise<AgentLog[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'agent')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((act: any) => ({
      id: act.id,
      user_id: act.user_id,
      agent_name: act.actor || 'AI Agent',
      action: act.action,
      input: act.input,
      output: act.output,
      status: act.status || 'Success',
      created_at: act.created_at
    }));
  }, [], 'getAgentLogs');
}

export async function logAgentAction(
  agentName: string,
  action: string,
  input?: string,
  output?: string,
  status: 'Success' | 'Failure' | 'Pending Approval' = 'Success'
): Promise<AgentLog> {
  const fallbackLog: AgentLog = {
    id: 'mock-act-' + Date.now(),
    user_id: 'demo-user',
    type: 'agent',
    agent_name: agentName,
    action,
    input: input || '',
    output: output || '',
    status,
    created_at: new Date().toISOString()
  };
  return safeWrite<AgentLog>(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: userId,
        type: 'agent',
        actor: agentName,
        action,
        input,
        output,
        status
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      user_id: data.user_id,
      type: 'agent',
      agent_name: data.actor || agentName,
      action: data.action,
      input: data.input,
      output: data.output,
      status: data.status,
      created_at: data.created_at
    } as AgentLog;
  }, fallbackLog, 'logAgentAction');
}

export async function getToolLogs(): Promise<ToolLog[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'tool')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((act: any) => ({
      id: act.id,
      user_id: act.user_id,
      type: 'tool',
      actor: act.actor,
      action: act.action,
      input: act.input,
      output: act.output,
      status: act.status || 'Success',
      error: act.error,
      created_at: act.created_at
    }));
  }, [], 'getToolLogs');
}

export async function logToolAction(
  toolName: string,
  action: string,
  input?: string,
  output?: string,
  status: 'Success' | 'Failure' = 'Success',
  error?: string
): Promise<ToolLog> {
  const fallbackLog: ToolLog = {
    id: 'mock-act-' + Date.now(),
    user_id: 'demo-user',
    type: 'tool',
    actor: toolName,
    action,
    input: input || '',
    output: output || '',
    status,
    error,
    created_at: new Date().toISOString()
  };
  return safeWrite<ToolLog>(async () => {
    const userId = await getUserId();
    const { data, error: err } = await supabase
      .from('activities')
      .insert({
        user_id: userId,
        type: 'tool',
        actor: toolName,
        action,
        input,
        output,
        status,
        error
      })
      .select()
      .single();

    if (err) throw err;

    return {
      id: data.id,
      user_id: data.user_id,
      type: 'tool',
      actor: data.actor || toolName,
      action: data.action,
      input: data.input,
      output: data.output,
      status: data.status,
      error: data.error,
      created_at: data.created_at
    } as ToolLog;
  }, fallbackLog, 'logToolAction');
}
