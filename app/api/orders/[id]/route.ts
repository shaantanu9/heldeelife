import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createCachedResponse } from '@/lib/utils/cache-headers'
import { REVALIDATE_TIMES } from '@/lib/constants'

// Route segment config - order detail cache for 1 minute
export const revalidate = REVALIDATE_TIMES.orderDetail

// GET /api/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const orderId = id

    let query = supabaseAdmin
      .from('orders')
      .select(
        `
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
      )
      .eq('id', orderId)
      .single()

    // Users can only see their own orders
    if (session.user.role !== 'admin') {
      query = query.eq('user_id', session.user.id)
    }

    const { data: order, error } = await query

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error in GET /api/orders/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/orders/[id] - Update order status (admin or user for pending orders)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const orderId = id
    const body = await request.json()

    // Check if user owns the order or is admin
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('user_id, status')
      .eq('id', orderId)
      .single()

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Users can only update their own pending orders
    if (
      session.user.role !== 'admin' &&
      existingOrder.user_id !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (session.user.role !== 'admin' && existingOrder.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only update pending orders' },
        { status: 400 }
      )
    }

    // Update order
    const updateData: any = {}

    if (body.status) {
      updateData.status = body.status
      if (body.status === 'shipped') {
        updateData.shipped_at = new Date().toISOString()
      }
      if (body.status === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      }
      if (body.status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString()
        updateData.cancelled_reason = body.cancelled_reason
      }
    }

    if (body.payment_status) {
      updateData.payment_status = body.payment_status
    }

    if (body.tracking_number !== undefined) {
      updateData.tracking_number = body.tracking_number
    }

    if (body.carrier !== undefined) {
      updateData.carrier = body.carrier
    }

    if (body.estimated_delivery !== undefined) {
      updateData.estimated_delivery = body.estimated_delivery
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          product_name,
          product_sku,
          quantity,
          unit_price,
          total_price
        )
      `
      )
      .single()

    if (error) {
      console.error('Error updating order:', error)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    // If order is confirmed/shipped, update inventory
    if (body.status === 'confirmed' || body.status === 'shipped') {
      const { data: orderItems } = await supabaseAdmin
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId)

      for (const item of orderItems || []) {
        if (item.product_id) {
          const { data: inventory } = await supabaseAdmin
            .from('inventory')
            .select('id, quantity, reserved_quantity')
            .eq('product_id', item.product_id)
            .single()

          if (inventory) {
            if (body.status === 'shipped') {
              // Deduct from inventory and release reservation
              await supabaseAdmin
                .from('inventory')
                .update({
                  quantity: inventory.quantity - item.quantity,
                  reserved_quantity: Math.max(
                    0,
                    (inventory.reserved_quantity || 0) - item.quantity
                  ),
                })
                .eq('id', inventory.id)

              // Update product sales count
              await supabaseAdmin.rpc('increment', {
                table_name: 'products',
                column_name: 'sales_count',
                id: item.product_id,
                amount: item.quantity,
              })
            }
          }
        }
      }
    }

    // If order is cancelled, release reserved inventory
    if (body.status === 'cancelled') {
      const { data: orderItems } = await supabaseAdmin
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId)

      for (const item of orderItems || []) {
        if (item.product_id) {
          const { data: inventory } = await supabaseAdmin
            .from('inventory')
            .select('id, reserved_quantity')
            .eq('product_id', item.product_id)
            .single()

          if (inventory) {
            await supabaseAdmin
              .from('inventory')
              .update({
                reserved_quantity: Math.max(
                  0,
                  (inventory.reserved_quantity || 0) - item.quantity
                ),
              })
              .eq('id', inventory.id)
          }
        }
      }
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error in PUT /api/orders/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
