import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// POST /api/admin/loyalty/points/[userId]/adjust - Adjust loyalty points (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = await params
    const body = await request.json()
    const { points, reason } = body

    if (!points || typeof points !== 'number') {
      return NextResponse.json(
        { error: 'Points amount is required' },
        { status: 400 }
      )
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      )
    }

    // Use the add_loyalty_points function
    const { data, error } = await supabaseAdmin.rpc('add_loyalty_points', {
      p_user_id: userId,
      p_points: points,
      p_transaction_type: 'adjusted',
      p_description: reason,
      p_reference_id: null,
      p_reference_type: 'admin_adjustment',
      p_expires_at: null,
    })

    if (error) {
      console.error('Error adjusting points:', error)
      return NextResponse.json(
        { error: 'Failed to adjust points' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transaction_id: data,
      message: 'Points adjusted successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/admin/loyalty/points/[userId]/adjust:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









