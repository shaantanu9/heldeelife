/**
 * Database Seed Script
 * Populates database with initial data for development/testing
 * 
 * Usage:
 *   npx tsx scripts/seed-database.ts
 * 
 * Or with ts-node:
 *   ts-node scripts/seed-database.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('  SUPABASE_URL')
  console.error('  SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface SeedData {
  categories?: Array<{
    name: string
    slug: string
    description?: string
    image_url?: string
  }>
  products?: Array<{
    name: string
    slug: string
    description: string
    price: number
    compare_at_price?: number
    sku: string
    category_id?: string
    image_url?: string
    is_active: boolean
    is_featured: boolean
    stock_quantity: number
  }>
}

async function seedCategories() {
  console.log('🌱 Seeding categories...')

  const categories = [
    {
      name: 'Ayurvedic Supplements',
      slug: 'ayurvedic-supplements',
      description: 'Traditional Ayurvedic supplements for holistic health',
      image_url: null,
    },
    {
      name: 'Herbal Products',
      slug: 'herbal-products',
      description: 'Natural herbal products and remedies',
      image_url: null,
    },
    {
      name: 'Wellness Products',
      slug: 'wellness-products',
      description: 'Products for overall wellness and vitality',
      image_url: null,
    },
    {
      name: 'Personal Care',
      slug: 'personal-care',
      description: 'Ayurvedic personal care products',
      image_url: null,
    },
  ]

  for (const category of categories) {
    const { data, error } = await supabase
      .from('product_categories')
      .upsert(category, { onConflict: 'slug' })
      .select()
      .single()

    if (error) {
      console.error(`❌ Error seeding category ${category.name}:`, error.message)
    } else {
      console.log(`✅ Seeded category: ${category.name}`)
    }
  }
}

async function seedProducts() {
  console.log('🌱 Seeding products...')

  // First, get category IDs
  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, slug')

  if (!categories || categories.length === 0) {
    console.error('❌ No categories found. Please seed categories first.')
    return
  }

  const categoryMap = new Map(
    categories.map((cat) => [cat.slug, cat.id])
  )

  const products = [
    {
      name: 'Turmeric Curcumin Supplement',
      slug: 'turmeric-curcumin-supplement',
      description:
        'Premium turmeric curcumin supplement with 95% curcuminoids for maximum absorption and effectiveness.',
      price: 599.99,
      compare_at_price: 799.99,
      sku: 'TUR-001',
      category_id: categoryMap.get('ayurvedic-supplements'),
      image_url: null,
      is_active: true,
      is_featured: true,
      stock_quantity: 100,
    },
    {
      name: 'Ashwagandha Root Extract',
      slug: 'ashwagandha-root-extract',
      description:
        'Pure Ashwagandha root extract to support stress management and overall wellness.',
      price: 699.99,
      compare_at_price: 899.99,
      sku: 'ASH-001',
      category_id: categoryMap.get('ayurvedic-supplements'),
      image_url: null,
      is_active: true,
      is_featured: true,
      stock_quantity: 75,
    },
    {
      name: 'Triphala Powder',
      slug: 'triphala-powder',
      description:
        'Traditional Ayurvedic blend of three fruits for digestive health and detoxification.',
      price: 399.99,
      compare_at_price: 499.99,
      sku: 'TRI-001',
      category_id: categoryMap.get('herbal-products'),
      image_url: null,
      is_active: true,
      is_featured: false,
      stock_quantity: 150,
    },
  ]

  for (const product of products) {
    const { data, error } = await supabase
      .from('products')
      .upsert(product, { onConflict: 'slug' })
      .select()
      .single()

    if (error) {
      console.error(`❌ Error seeding product ${product.name}:`, error.message)
    } else {
      console.log(`✅ Seeded product: ${product.name}`)
    }
  }
}

async function main() {
  console.log('🚀 Starting database seed...\n')

  try {
    await seedCategories()
    console.log('')
    await seedProducts()
    console.log('')
    console.log('✅ Database seeding completed!')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { seedCategories, seedProducts }







