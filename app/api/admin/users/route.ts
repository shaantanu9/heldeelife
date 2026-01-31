import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createCachedResponse } from '@/lib/utils/cache-headers'
import { REVALIDATE_TIMES } from '@/lib/constants'

// Route segment config - users cache for 10 minutes
export const revalidate = REVALIDATE_TIMES.users

// GET /api/admin/users - Get all users (admin only)
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
    const search = searchParams.get('search')
    const role = searchParams.get('role')

    let query = supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Fetch additional data for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        // Get loyalty points
        const { data: loyalty } = await supabaseAdmin
          .from('loyalty_points')
          .select('points, tier')
          .eq('user_id', user.id)
          .single()

        // Get order stats
        const { data: orders } = await supabaseAdmin
          .from('orders')
          .select('total_amount, payment_status')
          .eq('user_id', user.id)

        const totalOrders = orders?.length || 0
        const totalSpent =
          orders
            ?.filter((o) => o.payment_status === 'paid')
            .reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0

        return {
          ...user,
          loyalty_points: loyalty?.points || 0,
          loyalty_tier: loyalty?.tier,
          total_orders: totalOrders,
          total_spent: totalSpent,
        }
      })
    )

    // Apply search filter
    let filteredUsers = usersWithStats
    if (search) {
      filteredUsers = usersWithStats.filter(
        (u) =>
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          u.phone_number?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Cache users for 10 minutes (admin-only, private cache)
    return createCachedResponse(
      { users: filteredUsers },
      {
        public: false,
        maxAge: REVALIDATE_TIMES.users, // 10 minutes
        staleWhileRevalidate: 600, // 10 minutes
        mustRevalidate: false,
      }
    )
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
