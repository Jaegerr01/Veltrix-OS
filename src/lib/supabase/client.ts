import { createClient } from '@supabase/supabase-js';

const getSupabaseUrl = () => {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (url.includes('supabase.com/dashboard/project/')) {
    const parts = url.split('/');
    const ref = parts[parts.length - 1];
    url = `https://${ref}.supabase.co`;
  }
  return url;
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined')
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;
