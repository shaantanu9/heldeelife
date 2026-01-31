import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// POST /api/coupons/apply - Apply coupon to order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { order_id, coupon_id } = body

    if (!order_id || !coupon_id) {
      return NextResponse.json(
        { error: 'Order ID and coupon ID are required' },
        { status: 400 }
      )
    }

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, discount_amount')
      .eq('id', order_id)
      .eq('user_id', session.user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Get coupon
    const { data: coupon, error: couponError } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('id', coupon_id)
      .single()

    if (couponError || !coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    // Check if already used
    const { data: existingUsage } = await supabaseAdmin
      .from('coupon_usage')
      .select('id')
      .eq('coupon_id', coupon_id)
      .eq('user_id', session.user.id)
      .limit(1)

    if (existingUsage && existingUsage.length > 0) {
      return NextResponse.json(
        { error: 'You have already used this coupon' },
        { status: 400 }
      )
    }

    // Record coupon usage
    const { error: usageError } = await supabaseAdmin
      .from('coupon_usage')
      .insert({
        coupon_id,
        user_id: session.user.id,
        order_id,
        discount_amount: order.discount_amount || 0,
      })

    if (usageError) {
      console.error('Error recording coupon usage:', usageError)
      return NextResponse.json(
        { error: 'Failed to apply coupon' },
        { status: 500 }
      )
    }

    // Increment coupon used count
    await supabaseAdmin.rpc('increment', {
      table_name: 'coupons',
      column_name: 'used_count',
      id: coupon_id,
      amount: 1,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/coupons/apply:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









