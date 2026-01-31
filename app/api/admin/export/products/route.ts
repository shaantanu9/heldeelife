import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import { formatDateDisplay, getCurrentDateForFilename } from '@/lib/utils/date'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    const active = searchParams.get('active')

    let query = supabaseAdmin
      .from('products')
      .select(
        `
        *,
        product_categories (
          id,
          name,
          slug
        )
      `
      )
      .order('created_at', { ascending: false })

    // Apply filters
    if (active === 'false') {
      query = query.eq('is_active', false)
    } else if (active !== 'all') {
      query = query.eq('is_active', true)
    }

    if (category) {
      const { data: categoryData } = await supabaseAdmin
        .from('product_categories')
        .select('id')
        .eq('slug', category)
        .single()

      if (categoryData) {
        query = query.eq('category_id', categoryData.id)
      }
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,short_description.ilike.%${search}%`
      )
    }

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Get inventory
    const productIds = products?.map((p) => p.id) || []
    const { data: inventory } = await supabaseAdmin
      .from('inventory')
      .select('product_id, available_quantity')
      .in('product_id', productIds)

    const inventoryMap = new Map(
      inventory?.map((inv) => [inv.product_id, inv.available_quantity]) || []
    )

    // Prepare Excel data
    const exportData = (products || []).map((product) => ({
      'Product Name': product.name,
      SKU: product.sku || '',
      Price: product.price,
      Category: product.product_categories?.name || 'Uncategorized',
      'Stock Quantity': inventoryMap.get(product.id) || 0,
      Status: product.is_active ? 'Active' : 'Inactive',
      Featured: product.is_featured ? 'Yes' : 'No',
      'Created At': formatDateDisplay(product.created_at),
    }))

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    // Return file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="products_export_${getCurrentDateForFilename()}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/export/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
