import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isValidSupabaseConfig =
  supabaseUrl.trim().length > 0 &&
  supabaseUrl.startsWith('http') &&
  supabaseServiceRoleKey.trim().length > 0;

if (!isValidSupabaseConfig) {
  console.warn('[SUPABASE CONFIG] Missing or invalid SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Storage upload fallback active.');
}

/**
 * Reusable Supabase admin client powered strictly by the Service Role Key.
 * Safely initialized to prevent runtime crashes when credentials are missing.
 */
export const supabaseAdmin = isValidSupabaseConfig
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : ({
      storage: {
        from: (bucket: string) => ({
          getPublicUrl: (filePath: string) => ({ data: { publicUrl: `/uploads/${filePath}` } }),
          upload: async () => ({ data: { path: 'mock-upload.webp' }, error: new Error('Supabase credentials not configured') }),
          remove: async () => ({ error: null }),
        }),
      },
    } as any);

export const BUCKET_NAME = 'menu-images';

