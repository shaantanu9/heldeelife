import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createCachedResponse } from '@/lib/utils/cache-headers'
import { REVALIDATE_TIMES } from '@/lib/constants'

// Route segment config - return detail cache for 2 minutes
export const revalidate = REVALIDATE_TIMES.returns

// GET /api/returns/[id] - Get single return
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
      .eq('id', id)
      .single()

    // Users can only see their own returns
    if (session.user.role !== 'admin') {
      query = query.eq('user_id', session.user.id)
    }

    const { data: returnRequest, error } = await query

    if (error || !returnRequest) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 })
    }

    // Format return with customer info
    const formattedReturn = {
      ...returnRequest,
      order_number: returnRequest.orders?.order_number,
      customer_name:
        returnRequest.orders?.customer_name || returnRequest.users?.full_name,
      customer_email:
        returnRequest.orders?.customer_email || returnRequest.users?.email,
      customer_phone: returnRequest.orders?.customer_phone,
    }

    // Cache return detail for 2 minutes (private cache)
    return createCachedResponse(
      { return: formattedReturn },
      {
        public: false,
        maxAge: REVALIDATE_TIMES.returns, // 2 minutes
        staleWhileRevalidate: 300, // 5 minutes
        mustRevalidate: false,
      }
    )
  } catch (error) {
    console.error('Error in GET /api/returns/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/returns/[id] - Update return status (admin) or cancel (user)
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
    const body = await request.json()

    // Get existing return
    const { data: existingReturn, error: fetchError } = await supabaseAdmin
      .from('returns')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingReturn) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 })
    }

    // Users can only cancel their own pending returns
    if (
      session.user.role !== 'admin' &&
      existingReturn.user_id !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (session.user.role !== 'admin' && existingReturn.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only cancel pending returns' },
        { status: 400 }
      )
    }

    const updateData: any = {}

    if (body.status) {
      updateData.status = body.status

      // Set timestamps based on status
      if (body.status === 'picked_up') {
        updateData.picked_up_at = new Date().toISOString()
      } else if (body.status === 'received') {
        updateData.received_at = new Date().toISOString()
      } else if (body.status === 'processed' || body.status === 'refunded') {
        updateData.processed_at = new Date().toISOString()
      } else if (body.status === 'rejected') {
        updateData.rejection_reason =
          body.rejection_reason || 'Rejected by admin'
      }
    }

    if (body.tracking_number) {
      updateData.tracking_number = body.tracking_number
    }

    if (body.pickup_address) {
      updateData.pickup_address = body.pickup_address
    }

    const { data: updatedReturn, error } = await supabaseAdmin
      .from('returns')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        orders (
          id,
          order_number
        )
      `
      )
      .single()

    if (error) {
      console.error('Error updating return:', error)
      return NextResponse.json(
        { error: 'Failed to update return' },
        { status: 500 }
      )
    }

    // Create notification for status change
    if (body.status && body.status !== existingReturn.status) {
      const statusMessages: Record<string, string> = {
        approved: 'Your return request has been approved',
        rejected: 'Your return request has been rejected',
        picked_up: 'Your return has been picked up',
        received: 'We have received your return',
        processed: 'Your return has been processed',
        refunded: 'Your refund has been processed',
      }

      await supabaseAdmin.rpc('create_notification', {
        p_user_id: existingReturn.user_id,
        p_type: 'return_approved',
        p_title: 'Return Status Updated',
        p_message:
          statusMessages[body.status] ||
          `Your return status has been updated to ${body.status}`,
        p_data: { return_id: id, order_id: existingReturn.order_id },
      })
    }

    return NextResponse.json({ return: updatedReturn })
  } catch (error) {
    console.error('Error in PUT /api/returns/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/returns/[id] - Cancel return (user only, pending status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get existing return
    const { data: existingReturn, error: fetchError } = await supabaseAdmin
      .from('returns')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingReturn) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 })
    }

    // Only user can delete their own pending returns
    if (existingReturn.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (existingReturn.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only cancel pending returns' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin.from('returns').delete().eq('id', id)

    if (error) {
      console.error('Error deleting return:', error)
      return NextResponse.json(
        { error: 'Failed to cancel return' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/returns/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
