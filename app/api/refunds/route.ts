import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET /api/refunds - Get user refunds
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabaseAdmin
      .from('refunds')
      .select(
        `
        *,
        orders (
          id,
          order_number,
          total_amount
        )
      `
      )
      .order('created_at', { ascending: false })

    // Users can only see their own refunds
    if (session.user.role !== 'admin') {
      // Get user's order IDs
      const { data: userOrders } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('user_id', session.user.id)

      const orderIds = userOrders?.map((o) => o.id) || []
      if (orderIds.length === 0) {
        return NextResponse.json({ refunds: [] })
      }

      query = query.in('order_id', orderIds)
    }

    const { data: refunds, error } = await query

    if (error) {
      console.error('Error fetching refunds:', error)
      return NextResponse.json(
        { error: 'Failed to fetch refunds' },
        { status: 500 }
      )
    }

    // Transform data
    const transformedRefunds = refunds?.map((refund: any) => ({
      id: refund.id,
      order_id: refund.order_id,
      order_number: refund.orders?.order_number || '',
      reason: refund.reason,
      description: refund.description,
      status: refund.status,
      amount: refund.amount || refund.orders?.total_amount || 0,
      created_at: refund.created_at,
      processed_at: refund.processed_at,
      rejection_reason: refund.rejection_reason,
    }))

    return NextResponse.json({ refunds: transformedRefunds || [] })
  } catch (error) {
    console.error('Error in GET /api/refunds:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/refunds - Create refund request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { order_id, reason, description } = body

    if (!order_id || !reason || !description) {
      return NextResponse.json(
        { error: 'Order ID, reason, and description are required' },
        { status: 400 }
      )
    }

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status, total_amount')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (session.user.role !== 'admin' && order.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only delivered orders can be refunded
    if (order.status !== 'delivered') {
      return NextResponse.json(
        { error: 'Only delivered orders can be refunded' },
        { status: 400 }
      )
    }

    // Check if refund already exists
    const { data: existing } = await supabaseAdmin
      .from('refunds')
      .select('id')
      .eq('order_id', order_id)
      .eq('status', 'pending')
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'A pending refund request already exists for this order' },
        { status: 400 }
      )
    }

    // Create refund request
    const { data: refund, error: refundError } = await supabaseAdmin
      .from('refunds')
      .insert({
        order_id,
        user_id: session.user.id,
        reason,
        description,
        amount: order.total_amount,
        status: 'pending',
      })
      .select()
      .single()

    if (refundError) {
      console.error('Error creating refund:', refundError)
      return NextResponse.json(
        { error: 'Failed to create refund request' },
        { status: 500 }
      )
    }

    return NextResponse.json({ refund })
  } catch (error) {
    console.error('Error in POST /api/refunds:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









