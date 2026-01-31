import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// DELETE /api/payments/methods/[id] - Delete payment method
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

    // Verify payment method belongs to user
    const { data: method } = await supabaseAdmin
      .from('payment_methods')
      .select('id, user_id, is_default')
      .eq('id', id)
      .single()

    if (!method) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    if (method.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If deleting default, set another as default
    if (method.is_default) {
      const { data: otherMethods } = await supabaseAdmin
        .from('payment_methods')
        .select('id')
        .eq('user_id', session.user.id)
        .neq('id', id)
        .limit(1)

      if (otherMethods && otherMethods.length > 0) {
        await supabaseAdmin
          .from('payment_methods')
          .update({ is_default: true })
          .eq('id', otherMethods[0].id)
      }
    }

    const { error } = await supabaseAdmin
      .from('payment_methods')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting payment method:', error)
      return NextResponse.json(
        { error: 'Failed to delete payment method' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/payments/methods/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









