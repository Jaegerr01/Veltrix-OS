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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl !== 'undefined' && supabaseServiceKey !== 'undefined')
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null as any;
