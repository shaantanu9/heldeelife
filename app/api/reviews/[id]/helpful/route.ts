import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// POST /api/reviews/[id]/helpful - Mark review as helpful
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { is_helpful = true } = body

    // Check if review exists
    const { data: review } = await supabaseAdmin
      .from('product_reviews')
      .select('id')
      .eq('id', params.id)
      .single()

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Upsert helpful vote
    const { data: vote, error } = await supabaseAdmin
      .from('review_helpful_votes')
      .upsert(
        {
          review_id: params.id,
          user_id: session.user.id,
          is_helpful,
        },
        {
          onConflict: 'review_id,user_id',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error creating helpful vote:', error)
      return NextResponse.json(
        { error: 'Failed to update helpful vote' },
        { status: 500 }
      )
    }

    // Get updated helpful count
    const { data: reviewData } = await supabaseAdmin
      .from('product_reviews')
      .select('helpful_count')
      .eq('id', params.id)
      .single()

    return NextResponse.json({
      vote,
      helpful_count: reviewData?.helpful_count || 0,
    })
  } catch (error) {
    console.error('Error in POST /api/reviews/[id]/helpful:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[id]/helpful - Remove helpful vote
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabaseAdmin
      .from('review_helpful_votes')
      .delete()
      .eq('review_id', params.id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error deleting helpful vote:', error)
      return NextResponse.json(
        { error: 'Failed to remove helpful vote' },
        { status: 500 }
      )
    }

    // Get updated helpful count
    const { data: reviewData } = await supabaseAdmin
      .from('product_reviews')
      .select('helpful_count')
      .eq('id', params.id)
      .single()

    return NextResponse.json({
      success: true,
      helpful_count: reviewData?.helpful_count || 0,
    })
  } catch (error) {
    console.error('Error in DELETE /api/reviews/[id]/helpful:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/reviews/[id]/helpful - Get user's helpful vote status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ has_voted: false })
    }

    const { data: vote } = await supabaseAdmin
      .from('review_helpful_votes')
      .select('is_helpful')
      .eq('review_id', params.id)
      .eq('user_id', session.user.id)
      .single()

    return NextResponse.json({
      has_voted: !!vote,
      is_helpful: vote?.is_helpful || false,
    })
  } catch (error) {
    console.error('Error in GET /api/reviews/[id]/helpful:', error)
    return NextResponse.json({ has_voted: false })
  }
}









