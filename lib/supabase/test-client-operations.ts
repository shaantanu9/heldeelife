/**
 * Test script to verify Supabase client operations with the test table
 * Run with: npx tsx lib/supabase/test-client-operations.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables FIRST before importing any modules
config({ path: resolve(process.cwd(), '.env') })

// Import after env is loaded
import { createClient } from '@supabase/supabase-js'

// Create client directly for testing
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function testClientOperations() {
  console.log(
    '🧪 Testing Supabase client operations with test_products table...\n'
  )

  try {
    // Test 1: Read existing data
    console.log('📖 Test 1: Reading existing data...')
    const { data: readData, error: readError } = await supabase
      .from('test_products')
      .select('*')
      .limit(10)

    if (readError) {
      throw readError
    }

    console.log(`   ✅ Retrieved ${readData?.length || 0} records`)
    if (readData && readData.length > 0) {
      console.log('   Sample record:', readData[0])
    }

    // Test 2: Insert new data
    console.log('\n📝 Test 2: Inserting new data...')
    const { data: insertData, error: insertError } = await supabase
      .from('test_products')
      .insert({
        name: 'Client Test Product',
        description: 'Created via Supabase client',
        price: 299.99,
      })
      .select()

    if (insertError) {
      throw insertError
    }

    console.log('   ✅ Data inserted successfully!')
    console.log('   Inserted:', insertData[0])

    // Test 3: Update data
    if (insertData && insertData.length > 0) {
      console.log('\n✏️  Test 3: Updating data...')
      const { data: updateData, error: updateError } = await supabase
        .from('test_products')
        .update({ price: 349.99 })
        .eq('id', insertData[0].id)
        .select()

      if (updateError) {
        throw updateError
      }

      console.log('   ✅ Data updated successfully!')
      console.log('   Updated:', updateData[0])

      // Test 4: Delete data
      console.log('\n🗑️  Test 4: Deleting test data...')
      const { error: deleteError } = await supabase
        .from('test_products')
        .delete()
        .eq('id', insertData[0].id)

      if (deleteError) {
        throw deleteError
      }

      console.log('   ✅ Data deleted successfully!')
    }

    // Test 5: Filter and query
    console.log('\n🔍 Test 5: Testing filtered queries...')
    const { data: filteredData, error: filterError } = await supabase
      .from('test_products')
      .select('*')
      .gte('price', 100)
      .order('price', { ascending: true })
      .limit(5)

    if (filterError) {
      throw filterError
    }

    console.log(
      `   ✅ Filtered query successful: ${
        filteredData?.length || 0
      } records found`
    )
    if (filteredData && filteredData.length > 0) {
      console.log(
        '   Records:',
        filteredData.map((r) => `${r.name}: $${r.price}`).join(', ')
      )
    }

    console.log('\n✨ All client operations tests passed!')
    console.log('   ✅ Read operations: Working')
    console.log('   ✅ Insert operations: Working')
    console.log('   ✅ Update operations: Working')
    console.log('   ✅ Delete operations: Working')
    console.log('   ✅ Filtered queries: Working')
    console.log('\n🎉 Supabase is fully operational and ready for use!')
  } catch (error: any) {
    console.error('\n❌ Test failed:')
    console.error(`   ${error.message}`)
    if (error.details) {
      console.error(`   Details: ${error.details}`)
    }
    if (error.hint) {
      console.error(`   Hint: ${error.hint}`)
    }
    process.exit(1)
  }
}

testClientOperations()
