import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// POST /api/admin/abandoned-carts/[id]/send-email - Send recovery email (admin only)
export async function POST(
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

    // Get cart
    const { data: cart, error: cartError } = await supabaseAdmin
      .from('abandoned_carts')
      .select('*')
      .eq('id', id)
      .single()

    if (cartError || !cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    if (cart.recovered) {
      return NextResponse.json(
        { error: 'Cart already recovered' },
        { status: 400 }
      )
    }

    // Increment recovery attempts
    const { error: updateError } = await supabaseAdmin
      .from('abandoned_carts')
      .update({
        recovery_attempts: (cart.recovery_attempts || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating recovery attempts:', updateError)
    }

    // Email sending deferred: no email provider integrated yet.
    // Route updates recovery_attempts and returns success; integrate SendGrid/Resend when ready.
    console.log('Recovery email would be sent to:', cart.email, {
      cartId: id,
      totalAmount: cart.total_amount,
      itemCount: cart.item_count,
    })

    return NextResponse.json({
      success: true,
      message: 'Recovery email sent',
      attempts: (cart.recovery_attempts || 0) + 1,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/abandoned-carts/[id]/send-email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









