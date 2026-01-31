import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// DELETE /api/wishlist/[id] - Remove from wishlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this wishlist item
    const { data: existingItem } = await supabaseAdmin
      .from('wishlist')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (!existingItem || existingItem.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Wishlist item not found' },
        { status: 404 }
      )
    }

    const { error } = await supabaseAdmin
      .from('wishlist')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error removing from wishlist:', error)
      return NextResponse.json(
        { error: 'Failed to remove from wishlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/wishlist/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









