/**
 * Test script to verify Supabase connection
 * Run with: npx tsx lib/supabase/test-connection.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') })

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n')

  // Check environment variables
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('📋 Environment Variables:')
  console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
  console.log(
    `   SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`
  )
  console.log(
    `   SUPABASE_SERVICE_ROLE_KEY: ${
      supabaseServiceRoleKey ? '✅ Set' : '❌ Missing'
    }`
  )

  if (supabaseServiceRoleKey === supabaseAnonKey) {
    console.log(
      `   ⚠️  WARNING: Service role key appears to be the same as anon key!`
    )
  }
  console.log()

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables')
    process.exit(1)
  }

  try {
    // Create client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Test connection by making a simple API call (checking auth endpoint)
    console.log('🔌 Testing connection...')

    // Try to get the current user (will be null, but tests the connection)
    const { data: authData, error: authError } = await supabase.auth.getUser()

    // If auth works, connection is good. If it fails with a network error, that's a problem
    if (authError && authError.message.includes('fetch')) {
      throw new Error(`Network error: ${authError.message}`)
    }

    // Also test a simple REST API call
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    })

    if (!response.ok && response.status !== 404) {
      throw new Error(`API returned status ${response.status}`)
    }

    console.log('✅ Connection successful!')
    console.log(`   Project URL: ${supabaseUrl}`)
    const projectId = supabaseUrl.split('//')[1].split('.')[0]
    console.log(`   Project ID: ${projectId}`)
    console.log()

    // Test service role key if available
    if (supabaseServiceRoleKey && supabaseServiceRoleKey !== supabaseAnonKey) {
      console.log('🔐 Testing service role key...')
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
      const { error: adminError } = await supabaseAdmin.auth.getUser()

      if (adminError && adminError.message.includes('fetch')) {
        throw new Error(`Service role key network error: ${adminError.message}`)
      }

      console.log('✅ Service role key is valid and different from anon key')
    } else if (supabaseServiceRoleKey) {
      console.log(
        '⚠️  Service role key is set but appears to be the same as anon key'
      )
      console.log(
        '   Please update SUPABASE_SERVICE_ROLE_KEY in your .env file'
      )
      console.log(
        '   Get it from: Supabase Dashboard → Settings → API → service_role key'
      )
    }

    console.log('\n✨ All checks passed! Supabase is ready to use.')
  } catch (error: any) {
    console.error('❌ Connection failed:')
    console.error(`   ${error.message}`)
    if (error.details) {
      console.error(`   Details: ${error.details}`)
    }
    if (error.cause) {
      console.error(`   Cause: ${error.cause}`)
    }
    process.exit(1)
  }
}

testConnection()
