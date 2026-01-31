import { createClient } from '@supabase/supabase-js'

function createSupabaseAdminClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    const error = new Error('Missing env.SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
    console.error('❌ Supabase Configuration Error:', error.message)
    console.error('   Please add SUPABASE_URL to your .env.local file')
    throw error
  }

  const key = supabaseServiceRoleKey || supabaseAnonKey
  if (!key) {
    const error = new Error(
      'Missing env.SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY'
    )
    console.error('❌ Supabase Configuration Error:', error.message)
    console.error('   Please add API keys to your .env.local file')
    throw error
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch (urlError) {
    const error = new Error(`Invalid SUPABASE_URL format: ${supabaseUrl}`)
    console.error('❌ Supabase Configuration Error:', error.message)
    console.error('   SUPABASE_URL should be: https://your-project.supabase.co')
    throw error
  }

  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function createSupabaseClient() {
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
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Export clients - will be created when module is imported (only happens server-side)
export const supabaseAdmin = createSupabaseAdminClient()
export const supabase = createSupabaseClient()
