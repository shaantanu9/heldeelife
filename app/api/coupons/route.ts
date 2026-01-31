import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createCachedResponse } from '@/lib/utils/cache-headers'
import { REVALIDATE_TIMES } from '@/lib/constants'

// Route segment config - coupons cache for 10 minutes
export const revalidate = REVALIDATE_TIMES.coupons

// GET /api/coupons - Get coupons (public: active only, admin: all)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    let query = supabaseAdmin
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    // Public can only see active, valid coupons
    if (!session?.user || session.user.role !== 'admin') {
      query = query
        .eq('is_active', true)
        .gte('valid_from', new Date().toISOString())
        .or('valid_until.is.null,valid_until.gte.' + new Date().toISOString())
    }

    if (code) {
      query = query.eq('code', code.toUpperCase())
    }

    const { data: coupons, error } = await query

    if (error) {
      console.error('Error fetching coupons:', error)
      return NextResponse.json(
        { error: 'Failed to fetch coupons' },
        { status: 500 }
      )
    }

    // Cache coupons for 10 minutes (coupons don't change often)
    return createCachedResponse(
      { coupons: coupons || [] },
      {
        public: true, // Public cache (active coupons are public)
        maxAge: REVALIDATE_TIMES.coupons, // 10 minutes
        staleWhileRevalidate: 600, // 10 minutes
        mustRevalidate: false,
      }
    )
  } catch (error) {
    console.error('Error in GET /api/coupons:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/coupons - Create coupon (admin only)
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
      code,
      name,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      usage_limit,
      valid_from,
      valid_until,
      applicable_to,
      applicable_category_id,
      applicable_product_ids,
    } = body

    if (!code || !name || !discount_type || !discount_value) {
      return NextResponse.json(
        { error: 'Code, name, discount type, and discount value are required' },
        { status: 400 }
      )
    }

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .insert({
        code: code.toUpperCase(),
        name,
        description,
        discount_type,
        discount_value: parseFloat(discount_value),
        min_purchase_amount: min_purchase_amount
          ? parseFloat(min_purchase_amount)
          : 0,
        max_discount_amount: max_discount_amount
          ? parseFloat(max_discount_amount)
          : null,
        usage_limit,
        valid_from: valid_from || new Date().toISOString(),
        valid_until: valid_until || null,
        applicable_to: applicable_to || 'all',
        applicable_category_id,
        applicable_product_ids: applicable_product_ids || [],
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating coupon:', error)
      return NextResponse.json(
        { error: 'Failed to create coupon' },
        { status: 500 }
      )
    }

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/coupons:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

