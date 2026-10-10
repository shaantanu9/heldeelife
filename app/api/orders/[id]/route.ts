import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { canAccessOrder } from '@/lib/commerce/order-access'
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'

const NO_STORE = { 'Cache-Control': 'no-store' }

const ORDER_DETAIL_SELECT = `
  *,
  order_items (
    id,
    product_id,
    product_name,
    product_sku,
    product_image,
    quantity,
    unit_price,
    total_price,
    discount_amount
  ),
  order_status_history (
    id,
    status,
    previous_status,
    notes,
    location,
    created_at
  )
`

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET /api/orders/[id] - Get single order by id or order number.
// Access: admin, the owner, or a guest holding the order's access token
// (?token=). Tracking by order number additionally accepts ?email= matching
// the order's customer email.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')?.trim().toLowerCase()

    // Guest lookups by order number + email: throttle to stop enumeration
    if (email && !session?.user && !token) {
      const limiter = await rateLimit(
        `order-lookup:${getRateLimitIdentifier(request)}`,
        10,
        600
      )
      if (!limiter.success) {
        return NextResponse.json(
          { error: 'Too many attempts. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(
                Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000))
              ),
            },
          }
        )
      }
    }

    // Tracking page passes either the UUID or the human order number
    const byId = UUID_RE.test(id)
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(ORDER_DETAIL_SELECT)
      .eq(byId ? 'id' : 'order_number', byId ? id : id.trim().toUpperCase())
      .maybeSingle()

    const emailMatches =
      !!email &&
      !!order?.customer_email &&
      order.customer_email.toLowerCase() === email

    if (
      error ||
      !order ||
      !(canAccessOrder(order, session, token) || emailMatches)
    ) {
      // Same response whether missing or forbidden (no order enumeration)
      return NextResponse.json(
        {
          error:
            session?.user || token || email
              ? 'Order not found'
              : 'Unauthorized',
        },
        {
          status: session?.user || token || email ? 404 : 401,
          headers: NO_STORE,
        }
      )
    }

    return NextResponse.json({ order }, { headers: NO_STORE })
  } catch (error) {
    console.error('Error in GET /api/orders/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Allowed status transitions for admins. Stock movement for every
// transition is handled by the update_inventory_on_order_status trigger.
const ADMIN_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'processing', 'shipped', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
}

// PUT /api/orders/[id] - Update an order.
//  * Customers (owner or guest token) may only cancel a pending,
//    unpaid-or-COD order.
//  * Admins may change status along ADMIN_TRANSITIONS plus shipping /
//    payment metadata.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: orderId } = await params
    const body = await request.json().catch(() => ({}))
    const isAdmin = session?.user?.role === 'admin'

    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status, payment_status, payment_method')
      .eq('id', orderId)
      .maybeSingle()

    if (
      !existingOrder ||
      !canAccessOrder(existingOrder, session, body?.access_token)
    ) {
      return NextResponse.json(
        { error: session?.user ? 'Order not found' : 'Unauthorized' },
        { status: session?.user ? 404 : 401 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (!isAdmin) {
      if (body.status !== 'cancelled') {
        return NextResponse.json(
          { error: 'You can only cancel your order' },
          { status: 403 }
        )
      }
      if (existingOrder.status !== 'pending') {
        return NextResponse.json(
          {
            error:
              'Only pending orders can be cancelled. Please request a return instead.',
          },
          { status: 400 }
        )
      }
      if (existingOrder.payment_status === 'paid') {
        return NextResponse.json(
          {
            error:
              'This order is already paid. Please contact support to cancel and get a refund.',
          },
          { status: 400 }
        )
      }
      updateData.status = 'cancelled'
      updateData.cancelled_reason =
        typeof body.cancelled_reason === 'string'
          ? body.cancelled_reason.slice(0, 500)
          : 'Cancelled by customer'
    } else {
      if (body.status && body.status !== existingOrder.status) {
        const allowed = ADMIN_TRANSITIONS[existingOrder.status] || []
        if (!allowed.includes(body.status)) {
          return NextResponse.json(
            {
              error: `Cannot change status from ${existingOrder.status} to ${body.status}`,
            },
            { status: 400 }
          )
        }
        updateData.status = body.status
        if (body.status === 'cancelled') {
          updateData.cancelled_reason = body.cancelled_reason ?? null
        }
      }
      if (body.payment_status !== undefined) {
        if (
          !['pending', 'paid', 'failed', 'refunded'].includes(
            body.payment_status
          )
        ) {
          return NextResponse.json(
            { error: 'Invalid payment status' },
            { status: 400 }
          )
        }
        updateData.payment_status = body.payment_status
      }
      for (const field of [
        'tracking_number',
        'carrier',
        'estimated_delivery',
        'notes',
      ] as const) {
        if (body[field] !== undefined) updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select(ORDER_DETAIL_SELECT)
      .single()

    if (error) {
      console.error('Error updating order:', error)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    return NextResponse.json({ order }, { headers: NO_STORE })
  } catch (error) {
    console.error('Error in PUT /api/orders/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
