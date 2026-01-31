import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createCachedResponse } from '@/lib/utils/cache-headers'
import { REVALIDATE_TIMES } from '@/lib/constants'

// Route segment config - abandoned carts cache for 3 minutes
export const revalidate = REVALIDATE_TIMES.abandonedCarts

// GET /api/admin/abandoned-carts - Get abandoned carts (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const recovered = searchParams.get('recovered')
    const search = searchParams.get('search')

    let query = supabaseAdmin
      .from('abandoned_carts')
      .select(
        `
        *,
        users:user_id (
          email,
          full_name
        )
      `
      )
      .order('abandoned_at', { ascending: false })

    if (recovered === 'true') {
      query = query.eq('recovered', true)
    } else if (recovered === 'false') {
      query = query.eq('recovered', false)
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%`)
    }

    const { data: carts, error } = await query

    if (error) {
      console.error('Error fetching abandoned carts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch abandoned carts' },
        { status: 500 }
      )
    }

    // Format carts with user info
    const formattedCarts = (carts || []).map((cart: any) => ({
      id: cart.id,
      user_id: cart.user_id,
      email: cart.email || cart.users?.email,
      cart_data: cart.cart_data,
      total_amount: cart.total_amount,
      item_count: cart.item_count,
      recovery_attempts: cart.recovery_attempts,
      recovered: cart.recovered,
      recovered_at: cart.recovered_at,
      abandoned_at: cart.abandoned_at,
      expires_at: cart.expires_at,
    }))

    // Cache abandoned carts for 3 minutes (admin-only, private cache)
    return createCachedResponse(
      { carts: formattedCarts },
      {
        public: false,
        maxAge: REVALIDATE_TIMES.abandonedCarts, // 3 minutes
        staleWhileRevalidate: 300, // 5 minutes
        mustRevalidate: false,
      }
    )
  } catch (error) {
    console.error('Error in GET /api/admin/abandoned-carts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
