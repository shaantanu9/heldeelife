/**
 * Supabase Connection Diagnostic Script
 * Checks if Supabase is accessible and configured correctly
 * 
 * Usage:
 *   npx tsx scripts/check-supabase-connection.ts
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { lookup } from 'dns/promises'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function checkDNS(hostname: string): Promise<boolean> {
  try {
    const url = new URL(hostname)
    const host = url.hostname
    console.log(`🔍 Checking DNS for: ${host}`)
    await lookup(host)
    console.log(`✅ DNS resolution successful`)
    return true
  } catch (error) {
    console.error(`❌ DNS resolution failed:`, error)
    return false
  }
}

async function checkSupabaseConnection() {
  console.log('🔍 Supabase Connection Diagnostic\n')
  console.log('=' .repeat(50))

  // Check environment variables
  console.log('\n📋 Environment Variables:')
  console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
  console.log(
    `   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`
  )
  console.log(
    `   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? '✅ Set' : '❌ Missing'}`
  )
  console.log(
    `   SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`
  )

  if (!supabaseUrl) {
    console.error('\n❌ SUPABASE_URL is not set!')
    console.error('   Please add SUPABASE_URL to your .env.local file')
    process.exit(1)
  }

  // Check DNS
  console.log('\n🌐 Network Connectivity:')
  const dnsOk = await checkDNS(supabaseUrl)

  if (!dnsOk) {
    console.error('\n❌ Cannot resolve Supabase hostname!')
    console.error('\nPossible causes:')
    console.error('   1. Supabase project is paused or deleted')
    console.error('   2. Network connectivity issue')
    console.error('   3. Incorrect SUPABASE_URL')
    console.error('   4. DNS server issue')
    console.error('\nSolutions:')
    console.error('   1. Check Supabase dashboard: https://supabase.com/dashboard')
    console.error('   2. Verify project is active (not paused)')
    console.error('   3. Check your internet connection')
    console.error('   4. Verify SUPABASE_URL in .env.local')
    process.exit(1)
  }

  // Try to create client and test connection
  console.log('\n🔌 Testing Supabase Connection:')
  try {
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey || supabaseAnonKey || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Try a simple query
    console.log('   Attempting to connect...')
    const { data, error } = await supabase.from('products').select('id').limit(1)

    if (error) {
      console.error(`   ❌ Connection failed: ${error.message}`)
      console.error(`   Code: ${error.code || 'N/A'}`)
      console.error(`   Details: ${error.details || 'N/A'}`)
      console.error(`   Hint: ${error.hint || 'N/A'}`)

      if (error.message.includes('JWT')) {
        console.error('\n⚠️  Authentication error - check your API keys')
      } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.error('\n⚠️  Table does not exist - this is normal if database is empty')
      } else {
        console.error('\n⚠️  Connection issue - check Supabase project status')
      }
    } else {
      console.log('   ✅ Connection successful!')
      console.log(`   Response: ${data ? 'Data received' : 'No data (table may be empty)'}`)
    }
  } catch (error) {
    console.error('   ❌ Connection error:', error)
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`)
      if (error.message.includes('ENOTFOUND')) {
        console.error('\n⚠️  DNS resolution failed - check network connectivity')
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error('\n⚠️  Connection refused - Supabase project may be paused')
      }
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('\n✅ Diagnostic complete')
}

checkSupabaseConnection().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})







