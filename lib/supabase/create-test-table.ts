/**
 * Script to create a test table in Supabase using direct Postgres connection
 * Run with: npx tsx lib/supabase/create-test-table.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

// Load environment variables
config({ path: resolve(process.cwd(), '.env') })

const { Client } = pg

async function createTestTable() {
  console.log('🔧 Creating test table in Supabase...\n')

  const postgresUrl = process.env.POSTGRES_URL_NON_POOLING
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!postgresUrl) {
    console.error('❌ Missing POSTGRES_URL_NON_POOLING in .env')
    process.exit(1)
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  const testTableName = 'test_products_temp'

  try {
    // Method 1: Try using direct Postgres connection
    console.log('📋 Method 1: Using direct Postgres connection...')
    const client = new Client({
      connectionString: postgresUrl,
      ssl: { rejectUnauthorized: false },
    })

    await client.connect()
    console.log('   ✅ Connected to Postgres')

    // Create the table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${testTableName} (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10, 2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    await client.query(createTableSQL)
    console.log(`   ✅ Table '${testTableName}' created successfully`)

    // Test inserting data
    console.log('\n📝 Testing data insertion...')
    const insertResult = await client.query(
      `INSERT INTO ${testTableName} (name, description, price) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      ['Test Product', 'This is a test product', 99.99]
    )
    console.log('   ✅ Data inserted:', insertResult.rows[0])

    // Test reading data
    console.log('\n📖 Testing data retrieval...')
    const selectResult = await client.query(
      `SELECT * FROM ${testTableName} LIMIT 5`
    )
    console.log(`   ✅ Retrieved ${selectResult.rows.length} records`)
    console.log('   Records:', selectResult.rows)

    // Test updating data
    console.log('\n✏️  Testing data update...')
    const updateResult = await client.query(
      `UPDATE ${testTableName} 
       SET price = $1 
       WHERE name = $2 
       RETURNING *`,
      [149.99, 'Test Product']
    )
    console.log('   ✅ Data updated:', updateResult.rows[0])

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...')
    await client.query(`DELETE FROM ${testTableName} WHERE name = $1`, [
      'Test Product',
    ])
    console.log('   ✅ Test data cleaned up')

    await client.end()

    // Method 2: Test using Supabase client (now that table exists)
    console.log('\n🔌 Method 2: Testing with Supabase client...')
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Insert using Supabase client
    const { data: supabaseInsert, error: supabaseInsertError } = await supabase
      .from(testTableName)
      .insert({
        name: 'Supabase Test Product',
        description: 'Created via Supabase client',
        price: 199.99,
      })
      .select()

    if (supabaseInsertError) {
      throw supabaseInsertError
    }
    console.log('   ✅ Supabase client insert:', supabaseInsert)

    // Read using Supabase client
    const { data: supabaseRead, error: supabaseReadError } = await supabase
      .from(testTableName)
      .select('*')
      .limit(5)

    if (supabaseReadError) {
      throw supabaseReadError
    }
    console.log(
      `   ✅ Supabase client read: ${supabaseRead?.length || 0} records`
    )

    // Update using Supabase client
    if (supabaseInsert && supabaseInsert.length > 0) {
      const { data: supabaseUpdate, error: supabaseUpdateError } =
        await supabase
          .from(testTableName)
          .update({ price: 249.99 })
          .eq('id', supabaseInsert[0].id)
          .select()

      if (supabaseUpdateError) {
        throw supabaseUpdateError
      }
      console.log('   ✅ Supabase client update:', supabaseUpdate)

      // Delete using Supabase client
      const { error: supabaseDeleteError } = await supabase
        .from(testTableName)
        .delete()
        .eq('id', supabaseInsert[0].id)

      if (supabaseDeleteError) {
        throw supabaseDeleteError
      }
      console.log('   ✅ Supabase client delete: Success')
    }

    console.log('\n✨ All tests passed!')
    console.log('   ✅ Table creation: Working')
    console.log('   ✅ Direct Postgres operations: Working')
    console.log('   ✅ Supabase client operations: Working')
    console.log(`\n💡 Table '${testTableName}' is ready to use!`)
  } catch (error: any) {
    console.error('\n❌ Error:')
    console.error(`   ${error.message}`)
    if (error.code) {
      console.error(`   Code: ${error.code}`)
    }
    process.exit(1)
  }
}

createTestTable()









