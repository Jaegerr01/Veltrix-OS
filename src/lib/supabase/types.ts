import type { SupabaseClient } from '@supabase/supabase-js';

/** The app talks to Supabase without a generated Database type, so rows are narrowed in each mapper (see DbRow). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LooseSupabase = SupabaseClient<any, 'public', any>;
