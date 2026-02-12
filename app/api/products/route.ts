import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createCachedResponse } from '@/lib/utils/cache-headers'
import {
  isSupabaseConnectionError,
  createSupabaseErrorResponse,
} from '@/lib/utils/supabase-error-handler'


// GET /api/products - List products with caching
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('products')
      .select(
        `
        *,
        product_categories (
          id,
          name,
          slug
        ),
        inventory (
          id,
          quantity,
          reserved_quantity,
          available_quantity
        )
      `,
        { count: 'exact' }
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category_id', category)
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`
      )
    }

    let products, error, count
    try {
      const result = await query
      products = result.data
      error = result.error
      count = result.count
    } catch (queryError) {
      // Handle errors thrown during query execution
      if (isSupabaseConnectionError(queryError)) {
        const errorResponse = createSupabaseErrorResponse(queryError)
        console.error('Database connection error (thrown):', errorResponse.error)
        return NextResponse.json(
          {
            error: errorResponse.error,
            suggestion: errorResponse.suggestion,
            products: [],
            count: 0,
          },
          { status: 503 }
        )
      }
      // Re-throw non-connection errors
      throw queryError
    }

    if (error) {
      if (isSupabaseConnectionError(error)) {
        const errorResponse = createSupabaseErrorResponse(error)
        console.error('Database connection error (result.error):', errorResponse.error)
        return NextResponse.json(
          {
            error: errorResponse.error,
            suggestion: errorResponse.suggestion,
            products: [], // Return empty array instead of failing
            count: 0,
          },
          { status: 503 }
        )
      }

      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Return with cache headers
    return createCachedResponse(
      { products: products || [], count: count || 0 },
      'dynamic'
    )
  } catch (error) {
    console.error('Error in GET /api/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
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
      is_active = true,
      is_featured = false,
    } = body

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    const productSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        slug: productSlug,
        description,
        short_description,
        price: parseFloat(price),
        category_id,
        image,
        images: images || [],
        benefits: benefits || [],
        ingredients,
        usage_instructions,
        storage_instructions,
        expiry_info,
        manufacturer,
        sku,
        meta_title,
        meta_description,
        meta_keywords: meta_keywords || [],
        blog_links: blog_links || [],
        faq: faq || [],
        is_active,
        is_featured,
        created_by: session.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    // Return response
    const response = NextResponse.json({ product }, { status: 201 })
    response.headers.set('Cache-Control', 'no-cache, must-revalidate')
    return response
  } catch (error) {
    console.error('Error in POST /api/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
