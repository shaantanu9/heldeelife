import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a throwaway, per-request Supabase client for auth operations that
 * establish a user session (signInWithPassword, signUp, setSession, ...).
 *
 * NEVER call session-mutating auth methods on the shared `supabaseAdmin`
 * client: auth-js keeps the resulting session in memory (even with
 * persistSession: false) and supabase-js then sends that user's JWT instead
 * of the service-role key on every subsequent `supabaseAdmin.from()` call,
 * i.e. all server-side queries would run under the wrong identity.
 *
 * Uses the anon key so it has no elevated privileges, and is discarded after
 * the request.
 */
export function createIsolatedAuthClient(): SupabaseClient {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing env.SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!supabaseAnonKey) {
    throw new Error(
      'Missing env.SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
