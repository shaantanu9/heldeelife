import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// Route segment config for caching
export const dynamic = 'force-dynamic'

// Helper to check if string is UUID
const isUUID = (str: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// GET /api/products/[id] - Get single product by ID or slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    const identifier = id
    const isId = isUUID(identifier)

    let query = supabaseAdmin.from('products').select(
      `
        *,
        product_categories (
          id,
          name,
          slug
        )
      `
    )

    // Support both ID and slug for backward compatibility
    if (isId) {
      query = query.eq('id', identifier)
    } else {
      query = query.eq('slug', identifier)
    }

    // Public users can only see active products
    if (!session?.user || session.user.role !== 'admin') {
      query = query.eq('is_active', true)
    }

    const { data: product, error } = await query.single()

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get inventory
    const { data: inventory } = await supabaseAdmin
      .from('inventory')
      .select('available_quantity, quantity, reserved_quantity')
      .eq('product_id', product.id)
      .single()

    // Track product view
    if (session?.user) {
      await supabaseAdmin.from('product_views').insert({
        product_id: product.id,
        user_id: session.user.id,
      })
    }

    const productWithStock = {
      ...product,
      inStock: (inventory?.available_quantity || 0) > 0,
      stockQuantity: inventory?.available_quantity || 0,
      totalQuantity: inventory?.quantity || 0,
    }

    const response = NextResponse.json({ product: productWithStock })

    // Set cache headers for public requests
    if (!session?.user || session.user.role !== 'admin') {
      response.headers.set(
        'Cache-Control',
        'public, s-maxage=60, stale-while-revalidate=300'
      )
    }

    return response
  } catch (error) {
    console.error('Error in GET /api/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update product (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const productId = id
    const body = await request.json()

    // Extract all fields including SEO and blog links
    const {
      name,
      slug,
      description,
      short_description,
      price,
      category_id,
      image,
      images,
      benefits,
      ingredients,
      usage_instructions,
      storage_instructions,
      expiry_info,
      manufacturer,
      sku,
      meta_title,
      meta_description,
      meta_keywords,
      blog_links,
      faq,
      is_active,
      is_featured,
    } = body

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update({
        ...body,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error in PUT /api/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete product (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const productId = id

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('Error deleting product:', error)
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
