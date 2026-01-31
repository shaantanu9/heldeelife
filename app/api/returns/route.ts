import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createCachedResponse } from '@/lib/utils/cache-headers'
import { REVALIDATE_TIMES } from '@/lib/constants'

// Route segment config - returns cache for 2 minutes
export const revalidate = REVALIDATE_TIMES.returns

// GET /api/returns - Get returns (user: own, admin: all)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const orderId = searchParams.get('order_id')

    const search = searchParams.get('search')

    let query = supabaseAdmin
      .from('returns')
      .select(
        `
        *,
        orders (
          id,
          order_number,
          total_amount,
          status,
          customer_name,
          customer_email,
          customer_phone
        ),
        order_items (
          id,
          product_name,
          product_image,
          quantity,
          unit_price
        ),
        users:user_id (
          email,
          full_name
        )
      `
      )
      .order('created_at', { ascending: false })

    // Users can only see their own returns
    if (session.user.role !== 'admin') {
      query = query.eq('user_id', session.user.id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (orderId) {
      query = query.eq('order_id', orderId)
    }

    const { data: returns, error } = await query

    if (error) {
      console.error('Error fetching returns:', error)
      return NextResponse.json(
        { error: 'Failed to fetch returns' },
        { status: 500 }
      )
    }

    // Format returns with customer info
    let formattedReturns = (returns || []).map((returnItem: any) => ({
      ...returnItem,
      order_number: returnItem.orders?.order_number,
      customer_name:
        returnItem.orders?.customer_name || returnItem.users?.full_name,
      customer_email:
        returnItem.orders?.customer_email || returnItem.users?.email,
      customer_phone: returnItem.orders?.customer_phone,
    }))

    // Apply search filter
    if (search) {
      formattedReturns = formattedReturns.filter(
        (r: any) =>
          r.order_number?.toLowerCase().includes(search.toLowerCase()) ||
          r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
          r.customer_email?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Cache returns for 2 minutes (private cache)
    return createCachedResponse(
      { returns: formattedReturns },
      {
        public: false,
        maxAge: REVALIDATE_TIMES.returns, // 2 minutes
        staleWhileRevalidate: 300, // 5 minutes
        mustRevalidate: false,
      }
    )
  } catch (error) {
    console.error('Error in GET /api/returns:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/returns - Create return request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      order_id,
      order_item_id,
      reason,
      description,
      return_type,
      exchange_product_id,
    } = body

    if (!order_id || !reason || !description) {
      return NextResponse.json(
        { error: 'Order ID, reason, and description are required' },
        { status: 400 }
      )
    }

    // Verify order belongs to user and is eligible for return
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status, total_amount, delivered_at')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (session.user.role !== 'admin' && order.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only delivered orders can be returned (within reasonable time)
    if (order.status !== 'delivered') {
      return NextResponse.json(
        { error: 'Only delivered orders can be returned' },
        { status: 400 }
      )
    }

    // Check if return already exists for this order/item
    const returnQuery = supabaseAdmin
      .from('returns')
      .select('id')
      .eq('order_id', order_id)
      .in('status', ['pending', 'approved', 'picked_up', 'received'])

    if (order_item_id) {
      returnQuery.eq('order_item_id', order_item_id)
    }

    const { data: existing } = await returnQuery

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'A return request already exists for this order/item' },
        { status: 400 }
      )
    }

    // Calculate refund amount (full order or item-specific)
    let refundAmount = order.total_amount
    if (order_item_id) {
      const { data: orderItem } = await supabaseAdmin
        .from('order_items')
        .select('total_price')
        .eq('id', order_item_id)
        .single()

      if (orderItem) {
        refundAmount = orderItem.total_price
      }
    }

    // Create return request
    const { data: returnRequest, error: returnError } = await supabaseAdmin
      .from('returns')
      .insert({
        order_id,
        order_item_id: order_item_id || null,
        user_id: session.user.id,
        reason,
        description,
        return_type: return_type || 'refund',
        exchange_product_id: exchange_product_id || null,
        refund_amount: refundAmount,
        status: 'pending',
      })
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
      .single()

    if (returnError) {
      console.error('Error creating return:', returnError)
      return NextResponse.json(
        { error: 'Failed to create return request' },
        { status: 500 }
      )
    }

    // Create notification
    await supabaseAdmin.rpc('create_notification', {
      p_user_id: session.user.id,
      p_type: 'return_approved',
      p_title: 'Return Request Submitted',
      p_message: `Your return request for order #${(returnRequest.orders as any)?.order_number || order_id.slice(0, 8)} has been submitted and is under review.`,
      p_data: { return_id: returnRequest.id, order_id },
    })

    return NextResponse.json({ return: returnRequest }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/returns:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
