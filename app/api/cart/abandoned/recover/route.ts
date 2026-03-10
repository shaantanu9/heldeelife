import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { cartId, email } = body

    if (!cartId) {
      return NextResponse.json(
        { error: 'Cart ID is required' },
        { status: 400 }
      )
    }

    const isAdmin = session.user.role === 'admin'

    if (!isAdmin) {
      // Non-admin: verify ownership — cart email must match session user email
      const { data: cart, error: fetchError } = await supabaseAdmin
        .from('abandoned_carts')
        .select('email')
        .eq('id', cartId)
        .single()

      if (fetchError || !cart) {
        return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
      }

      if (!session.user.email || cart.email !== session.user.email) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Mark cart as recovered
    const { error } = await supabaseAdmin
      .from('abandoned_carts')
      .update({
        recovered: true,
        recovered_at: new Date().toISOString(),
      })
      .eq('id', cartId)

    if (error) {
      console.error('Error recovering cart:', error)
      return NextResponse.json(
        { error: 'Failed to recover cart' },
        { status: 500 }
      )
    }

    // In production, send recovery confirmation email
    console.log('Cart recovered:', { cartId, email })

    return NextResponse.json({
      success: true,
      message: 'Cart recovered',
    })
  } catch (error) {
    console.error('Error in POST /api/cart/abandoned/recover:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

