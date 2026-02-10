import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/admin/users/[id] - Get single user (admin only)
export async function GET(
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
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const [{ data: loyalty }, { data: orders }] = await Promise.all([
      supabaseAdmin
        .from('loyalty_points')
        .select('points, tier')
        .eq('user_id', id)
        .single(),
      supabaseAdmin.from('orders').select('total_amount, payment_status').eq('user_id', id),
    ])

    const totalOrders = orders?.length || 0
    const totalSpent =
      orders
        ?.filter((o) => o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0

    const userWithStats = {
      ...user,
      loyalty_points: loyalty?.points ?? 0,
      loyalty_tier: loyalty?.tier ?? null,
      total_orders: totalOrders,
      total_spent: totalSpent,
    }

    return NextResponse.json({ user: userWithStats })
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
