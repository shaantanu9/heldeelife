/**
 * Script to create an admin user using Supabase Admin API
 * This ensures the password is properly hashed and the user is set up correctly
 *
 * Run with: npx tsx scripts/create-admin-user.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

async function createAdminUser() {
  // Try to get from environment or use the project URL
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://jwkduwxvxtggpxlzgyan.supabase.co'

  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceRoleKey) {
    console.error('\n❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    console.error('\nTo fix this:')
    console.error('1. Get your Service Role Key from Supabase Dashboard:')
    console.error('   Project Settings → API → service_role key (secret)')
    console.error('2. Add it to your .env.local file:')
    console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here')
    console.error('\nOr run the script with:')
    console.error(
      'SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/create-admin-user.ts\n'
    )
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  // Create admin client with service role key
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const email = 'shantanubombatkar2@gmail.com'
  const password = 'asdfgASDFG@98'

  try {
    console.log('Creating admin user...')

    // Create user using Supabase Admin API
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: 'Admin User',
        },
      })

    if (authError) {
      console.error('Error creating auth user:', authError)
      throw authError
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user data returned')
    }

    console.log('✅ Auth user created:', authData.user.id)

    // Create/update user profile in public.users table with admin role
    const { error: profileError } = await supabaseAdmin.from('users').upsert(
      {
        id: authData.user.id,
        email: authData.user.email || email,
        role: 'admin',
      },
      {
        onConflict: 'id',
      }
    )

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      throw profileError
    }

    console.log('✅ User profile created with admin role')

    console.log('\n🎉 Admin user created successfully!')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('User ID:', authData.user.id)
    console.log('Role: admin')
    console.log('\nYou can now sign in at /auth/signin')

    return authData.user
  } catch (error) {
    console.error('Failed to create admin user:', error)
    throw error
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
