import { createClient } from '@supabase/supabase-js';
import { ENV } from './env';

// Service Role Client (Backend-only, bypasses RLS for administrative verification and secure checks)
export const supabaseAdmin = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Anon Client (For public actions and verifying user password tokens)
export const supabaseAnon = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

