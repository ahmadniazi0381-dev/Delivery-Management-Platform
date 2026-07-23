import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('[SUPABASE CONFIG] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

/**
 * Reusable Supabase admin client powered strictly by the Service Role Key.
 * MUST NEVER be sent or exposed to the frontend client.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const BUCKET_NAME = 'menu-images';
