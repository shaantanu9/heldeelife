import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// POST /api/coupons/validate - Validate coupon code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, subtotal } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      )
    }

    // Get coupon
    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !coupon) {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 404 }
      )
    }

    // Check validity dates
    const now = new Date()
    if (new Date(coupon.valid_from) > now) {
      return NextResponse.json(
        { error: 'Coupon not yet valid' },
        { status: 400 }
      )
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 })
    }

    // Check minimum purchase amount
    if (subtotal && coupon.min_purchase_amount > subtotal) {
      return NextResponse.json(
        {
          error: `Minimum purchase amount of Rs. ${coupon.min_purchase_amount} required`,
        },
        { status: 400 }
      )
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json(
        { error: 'Coupon usage limit reached' },
        { status: 400 }
      )
    }

    // Check if user already used this coupon
    const { data: existingUsage } = await supabaseAdmin
      .from('coupon_usage')
      .select('id')
      .eq('coupon_id', coupon.id)
      .eq('user_id', session.user.id)
      .limit(1)

    if (existingUsage && existingUsage.length > 0) {
      return NextResponse.json(
        { error: 'You have already used this coupon' },
        { status: 400 }
      )
    }

    // Calculate discount
    let discountAmount = 0
    if (subtotal) {
      if (coupon.discount_type === 'percentage') {
        discountAmount = (subtotal * coupon.discount_value) / 100
        if (coupon.max_discount_amount) {
          discountAmount = Math.min(discountAmount, coupon.max_discount_amount)
        }
      } else {
        discountAmount = coupon.discount_value
      }
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      },
      discount_amount: discountAmount,
    })
  } catch (error) {
    console.error('Error in POST /api/coupons/validate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









