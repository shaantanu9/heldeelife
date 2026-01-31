import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET /api/coupons/[id] - Get single coupon
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Error in GET /api/coupons/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/coupons/[id] - Update coupon (admin only)
export async function PUT(
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
    const body = await request.json()
    const {
      code,
      name,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      usage_limit,
      is_active,
      valid_from,
      valid_until,
      applicable_to,
      applicable_category_id,
      applicable_product_ids,
    } = body

    const updateData: any = {}

    if (code !== undefined) updateData.code = code.toUpperCase()
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (discount_type !== undefined) updateData.discount_type = discount_type
    if (discount_value !== undefined)
      updateData.discount_value = parseFloat(discount_value)
    if (min_purchase_amount !== undefined)
      updateData.min_purchase_amount = parseFloat(min_purchase_amount) || 0
    if (max_discount_amount !== undefined)
      updateData.max_discount_amount = max_discount_amount
        ? parseFloat(max_discount_amount)
        : null
    if (usage_limit !== undefined) updateData.usage_limit = usage_limit
    if (is_active !== undefined) updateData.is_active = is_active
    if (valid_from !== undefined) updateData.valid_from = valid_from
    if (valid_until !== undefined) updateData.valid_until = valid_until || null
    if (applicable_to !== undefined) updateData.applicable_to = applicable_to
    if (applicable_category_id !== undefined)
      updateData.applicable_category_id = applicable_category_id
    if (applicable_product_ids !== undefined)
      updateData.applicable_product_ids = applicable_product_ids || []

    updateData.updated_at = new Date().toISOString()

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating coupon:', error)
      return NextResponse.json(
        { error: 'Failed to update coupon' },
        { status: 500 }
      )
    }

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Error in PUT /api/coupons/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/coupons/[id] - Delete coupon (admin only)
export async function DELETE(
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
    const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id)

    if (error) {
      console.error('Error deleting coupon:', error)
      return NextResponse.json(
        { error: 'Failed to delete coupon' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/coupons/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









