import { createClient } from '@supabase/supabase-js';

// Publishable keys are designed for browser use. Never put a service_role/secret key here.
const SUPABASE_URL = 'https://eopvkwhcgznvubesaszv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_d3hVgDqwTuB63BtfumPwoQ_ngy2ig_c';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
