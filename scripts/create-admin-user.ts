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

    type AuthUser = { id: string; email?: string; user_metadata?: Record<string, unknown> }
    let userForProfile: AuthUser

    if (authError) {
      if (
        authError.message?.includes('already been registered') ||
        (authError as { code?: string }).code === 'email_exists'
      ) {
        console.log('User already exists, looking up to promote to admin...')
        let existing: AuthUser | null = null
        let page = 1
        const perPage = 500
        while (true) {
          const { data } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage,
          })
          const match = data?.users?.find((u) => u.email === email)
          if (match) {
            existing = match
            break
          }
          const pagination = data as { total?: number } | undefined
          const total = pagination?.total ?? 0
          if (page * perPage >= total || !data?.users?.length) break
          page += 1
        }
        if (!existing) {
          console.error('Could not find existing user by email:', email)
          throw authError
        }
        userForProfile = existing
        console.log('✅ Found existing auth user:', userForProfile.id)
      } else {
        console.error('Error creating auth user:', authError)
        throw authError
      }
    } else if (!authData.user) {
      throw new Error('User creation failed - no user data returned')
    } else {
      userForProfile = authData.user
      console.log('✅ Auth user created:', userForProfile.id)
    }

    // Create/update user profile in public.users table with admin role
    const fullName =
      (userForProfile.user_metadata?.full_name as string) || 'Admin User'
    const { error: profileError } = await supabaseAdmin.from('users').upsert(
      {
        id: userForProfile.id,
        email: userForProfile.email || email,
        full_name: fullName,
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

    console.log('✅ User profile created/updated with admin role')

    console.log('\n🎉 Admin user ready!')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('User ID:', userForProfile.id)
    console.log('Role: admin')
    console.log('\nYou can now sign in at /auth/signin')

    return userForProfile
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
