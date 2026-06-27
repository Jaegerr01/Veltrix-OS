import type { Revenue, Expense } from '../types';
import { supabase, getUserId, safeRead, safeWrite } from './_core';

export async function getRevenue(): Promise<Revenue[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('revenue')
      .select('*')
      .eq('user_id', userId)
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }, [], 'getRevenue');
}

export async function addRevenue(rev: Omit<Revenue, 'id' | 'created_at'>): Promise<Revenue> {
  const fallbackRevenue: Revenue = {
    id: 'mock-rev-' + Date.now(),
    created_at: new Date().toISOString(),
    client_id: rev.client_id,
    proposal_id: rev.proposal_id || '',
    amount: rev.amount,
    type: rev.type,
    status: rev.status || 'Paid',
    payment_date: rev.payment_date,
    month: rev.month,
    notes: rev.notes || '',
    user_id: 'demo-user'
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('revenue')
      .insert({ ...rev, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, fallbackRevenue, 'addRevenue');
}

export async function getExpenses(): Promise<Expense[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  }, [], 'getExpenses');
}

export async function addExpense(exp: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
  const fallbackExpense: Expense = {
    id: 'mock-exp-' + Date.now(),
    created_at: new Date().toISOString(),
    title: exp.title,
    amount: exp.amount,
    category: exp.category,
    date: exp.date,
    notes: exp.notes || '',
    user_id: 'demo-user'
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...exp, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, fallbackExpense, 'addExpense');
}
