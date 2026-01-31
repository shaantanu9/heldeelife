/**
 * Database Backup Script
 * Creates JSON backups of critical database tables
 * 
 * Usage:
 *   npm run backup:database
 *   npx tsx scripts/backup-database.ts
 * 
 * Output:
 *   backups/products-{timestamp}.json
 *   backups/orders-{timestamp}.json
 *   etc.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('  SUPABASE_URL')
  console.error('  SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Critical tables to backup
const criticalTables = [
  'products',
  'product_categories',
  'orders',
  'order_items',
  'users',
  'blog_posts',
  'blog_categories',
  'coupons',
  'inventory',
]

// Important tables (backup if exists)
const importantTables = [
  'user_addresses',
  'payment_methods',
  'product_reviews',
  'wishlist',
  'cart_analytics',
]

interface BackupResult {
  table: string
  success: boolean
  recordCount: number
  filePath?: string
  error?: string
}

async function backupTable(
  tableName: string,
  backupDir: string,
  timestamp: string
): Promise<BackupResult> {
  try {
    console.log(`📦 Backing up ${tableName}...`)

    const { data, error } = await supabase.from(tableName).select('*')

    if (error) {
      console.error(`❌ Error backing up ${tableName}:`, error.message)
      return {
        table: tableName,
        success: false,
        recordCount: 0,
        error: error.message,
      }
    }

    if (!data || data.length === 0) {
      console.log(`⚠️  ${tableName} is empty, skipping...`)
      return {
        table: tableName,
        success: true,
        recordCount: 0,
      }
    }

    const fileName = `${tableName}-${timestamp}.json`
    const filePath = join(backupDir, fileName)

    const backupData = {
      table: tableName,
      timestamp: new Date().toISOString(),
      recordCount: data.length,
      data: data,
    }

    await writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf-8')

    console.log(`✅ Backed up ${tableName}: ${data.length} records → ${fileName}`)

    return {
      table: tableName,
      success: true,
      recordCount: data.length,
      filePath: filePath,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Error backing up ${tableName}:`, errorMessage)
    return {
      table: tableName,
      success: false,
      recordCount: 0,
      error: errorMessage,
    }
  }
}

async function createBackupSummary(
  results: BackupResult[],
  backupDir: string,
  timestamp: string
) {
  const summary = {
    backupDate: new Date().toISOString(),
    timestamp: timestamp,
    totalTables: results.length,
    successfulBackups: results.filter((r) => r.success).length,
    failedBackups: results.filter((r) => !r.success).length,
    totalRecords: results.reduce((sum, r) => sum + r.recordCount, 0),
    results: results.map((r) => ({
      table: r.table,
      success: r.success,
      recordCount: r.recordCount,
      filePath: r.filePath,
      error: r.error,
    })),
  }

  const summaryPath = join(backupDir, `backup-summary-${timestamp}.json`)
  await writeFile(
    summaryPath,
    JSON.stringify(summary, null, 2),
    'utf-8'
  )

  console.log('\n📊 Backup Summary:')
  console.log(`   Total Tables: ${summary.totalTables}`)
  console.log(`   Successful: ${summary.successfulBackups}`)
  console.log(`   Failed: ${summary.failedBackups}`)
  console.log(`   Total Records: ${summary.totalRecords}`)
  console.log(`   Summary: ${summaryPath}\n')

  return summary
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = join(process.cwd(), 'backups')

  // Create backups directory if it doesn't exist
  if (!existsSync(backupDir)) {
    await mkdir(backupDir, { recursive: true })
    console.log(`📁 Created backup directory: ${backupDir}`)
  }

  console.log('🚀 Starting database backup...\n')
  console.log(`📅 Backup timestamp: ${timestamp}`)
  console.log(`📂 Backup directory: ${backupDir}\n`)

  const results: BackupResult[] = []

  // Backup critical tables
  console.log('🔴 Backing up critical tables...\n')
  for (const table of criticalTables) {
    const result = await backupTable(table, backupDir, timestamp)
    results.push(result)
  }

  // Backup important tables (if they exist)
  console.log('\n🟡 Backing up important tables...\n')
  for (const table of importantTables) {
    const result = await backupTable(table, backupDir, timestamp)
    results.push(result)
  }

  // Create summary
  const summary = await createBackupSummary(results, backupDir, timestamp)

  // Exit with error code if any critical backups failed
  const criticalFailures = results.filter(
    (r) => !r.success && criticalTables.includes(r.table)
  )

  if (criticalFailures.length > 0) {
    console.error(
      `\n❌ ${criticalFailures.length} critical backup(s) failed!`
    )
    process.exit(1)
  }

  console.log('✅ Database backup completed successfully!')
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error during backup:', error)
    process.exit(1)
  })
}

export { backupTable, createBackupSummary }







