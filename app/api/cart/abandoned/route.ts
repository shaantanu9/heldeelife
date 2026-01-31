import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { cart, email } = body

    if (!cart || !email) {
      return NextResponse.json(
        { error: 'Cart and email are required' },
        { status: 400 }
      )
    }

    // Calculate item count
    const itemCount = cart.items?.length || 0

    // Store abandoned cart in database
    const { data, error } = await supabaseAdmin
      .from('abandoned_carts')
      .insert({
        user_id: session?.user?.id || null,
        email: email,
        cart_data: cart,
        total_amount: cart.totalPrice || 0,
        item_count: itemCount,
        recovery_attempts: 0,
        recovered: false,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving abandoned cart:', error)
      return NextResponse.json(
        { error: 'Failed to save abandoned cart' },
        { status: 500 }
      )
    }

    // In production, trigger email sending service here
    // For now, we'll just log it
    console.log('Abandoned cart saved:', {
      cartId: data.id,
      email,
      totalPrice: cart.totalPrice,
    })

    return NextResponse.json({
      success: true,
      cartId: data.id,
      message: 'Abandoned cart saved',
    })
  } catch (error) {
    console.error('Error in POST /api/cart/abandoned:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

