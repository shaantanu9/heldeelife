import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

interface ProductImportRow {
  name: string
  slug?: string
  price: number
  sku?: string
  category?: string
  description?: string
  short_description?: string
  image?: string
  images?: string
  is_active?: boolean | string
  is_featured?: boolean | string
  initial_quantity?: number | string
  compare_at_price?: number
  cost_price?: number
  manufacturer?: string
  ingredients?: string
  usage_instructions?: string
  storage_instructions?: string
  expiry_info?: string
  meta_title?: string
  meta_description?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file buffer
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const rows: ProductImportRow[] = XLSX.utils.sheet_to_json(worksheet)

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No data found in file' },
        { status: 400 }
      )
    }

    // Get all categories for lookup
    const { data: categories } = await supabaseAdmin
      .from('product_categories')
      .select('id, name, slug')

    const categoryMap = new Map(
      categories?.map((cat) => [cat.name.toLowerCase(), cat.id]) || []
    )

    const results = {
      success: [] as any[],
      errors: [] as Array<{ row: number; error: string; data: any }>,
      total: rows.length,
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // Excel row number (1-indexed + header)

      try {
        // Validate required fields
        if (!row.name || !row.price) {
          results.errors.push({
            row: rowNumber,
            error: 'Name and price are required',
            data: row,
          })
          continue
        }

        // Generate slug if not provided
        const slug =
          row.slug ||
          row.name
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')

        // Find category
        let categoryId: string | undefined
        if (row.category) {
          const categoryName = row.category.toString().toLowerCase()
          categoryId = categoryMap.get(categoryName)
        }

        // Parse boolean values
        const isActive =
          row.is_active === undefined || row.is_active === ''
            ? true
            : row.is_active === true ||
              row.is_active === 'true' ||
              row.is_active === 'TRUE' ||
              row.is_active === '1' ||
              row.is_active === 1

        const isFeatured =
          row.is_featured === true ||
          row.is_featured === 'true' ||
          row.is_featured === 'TRUE' ||
          row.is_featured === '1' ||
          row.is_featured === 1

        // Parse images array
        const images = row.images
          ? row.images
              .toString()
              .split(',')
              .map((img) => img.trim())
              .filter(Boolean)
          : []

        // Create product
        const { data: product, error: productError } = await supabaseAdmin
          .from('products')
          .insert({
            name: row.name.toString().trim(),
            slug,
            price: parseFloat(row.price.toString()),
            sku: row.sku?.toString().trim() || undefined,
            category_id: categoryId,
            description: row.description?.toString().trim() || undefined,
            short_description:
              row.short_description?.toString().trim() || undefined,
            image: row.image?.toString().trim() || undefined,
            images: images.length > 0 ? images : undefined,
            compare_at_price: row.compare_at_price
              ? parseFloat(row.compare_at_price.toString())
              : undefined,
            cost_price: row.cost_price
              ? parseFloat(row.cost_price.toString())
              : undefined,
            manufacturer: row.manufacturer?.toString().trim() || undefined,
            ingredients: row.ingredients?.toString().trim() || undefined,
            usage_instructions:
              row.usage_instructions?.toString().trim() || undefined,
            storage_instructions:
              row.storage_instructions?.toString().trim() || undefined,
            expiry_info: row.expiry_info?.toString().trim() || undefined,
            meta_title: row.meta_title?.toString().trim() || undefined,
            meta_description:
              row.meta_description?.toString().trim() || undefined,
            is_active: isActive,
            is_featured: isFeatured,
            created_by: session.user.id,
          })
          .select()
          .single()

        if (productError) {
          results.errors.push({
            row: rowNumber,
            error: productError.message,
            data: row,
          })
          continue
        }

        // Create inventory if initial quantity provided
        if (
          row.initial_quantity &&
          parseInt(row.initial_quantity.toString()) > 0
        ) {
          await supabaseAdmin.from('inventory').insert({
            product_id: product.id,
            quantity: parseInt(row.initial_quantity.toString()),
            available_quantity: parseInt(row.initial_quantity.toString()),
            location: 'main',
          })
        }

        results.success.push({
          row: rowNumber,
          product: { id: product.id, name: product.name },
        })
      } catch (error: any) {
        results.errors.push({
          row: rowNumber,
          error: error.message || 'Unknown error',
          data: row,
        })
      }
    }

    return NextResponse.json({
      message: `Import completed: ${results.success.length} successful, ${results.errors.length} errors`,
      results,
    })
  } catch (error: any) {
    console.error('Error in bulk import:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import products' },
      { status: 500 }
    )
  }
}









