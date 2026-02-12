import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// PUT /api/reviews/[id] - Update review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      rating,
      title,
      comment,
      is_approved,
      review_images,
      moderation_status,
      admin_response,
    } = body

    // Check if user owns this review or is admin
    const { data: existingReview } = await supabaseAdmin
      .from('product_reviews')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Only admins can approve reviews and add responses
    const updateData: any = {}
    if (session.user.role === 'admin') {
      if (is_approved !== undefined) {
        updateData.is_approved = is_approved
        // Sync moderation_status with is_approved for backward compatibility
        if (is_approved) {
          updateData.moderation_status = 'approved'
        } else {
          updateData.moderation_status = 'pending'
        }
      }
      if (moderation_status !== undefined) {
        updateData.moderation_status = moderation_status
        // Sync is_approved with moderation_status
        updateData.is_approved = moderation_status === 'approved'
      }
      if (admin_response !== undefined) {
        updateData.admin_response = admin_response
        updateData.admin_response_at = new Date().toISOString()
        updateData.admin_response_by = session.user.id
      }
      if (rating !== undefined) updateData.rating = rating
      if (title !== undefined) updateData.title = title
      if (comment !== undefined) updateData.comment = comment
      if (review_images !== undefined) updateData.review_images = review_images
    } else {
      // Users can only update their own reviews
      if (existingReview.user_id !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (rating !== undefined) updateData.rating = rating
      if (title !== undefined) updateData.title = title
      if (comment !== undefined) updateData.comment = comment
      if (review_images !== undefined) {
        // Validate review images (max 5 images)
        if (Array.isArray(review_images) && review_images.length > 5) {
          return NextResponse.json(
            { error: 'Maximum 5 images allowed per review' },
            { status: 400 }
          )
        }
        updateData.review_images = review_images
      }
    }

    const { data: review, error } = await supabaseAdmin
      .from('product_reviews')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating review:', error)
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      )
    }

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Error in PUT /api/reviews/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[id] - Delete review
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

    // Check if user owns this review or is admin
    const { data: existingReview } = await supabaseAdmin
      .from('product_reviews')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (
      existingReview.user_id !== session.user.id &&
      session.user.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('product_reviews')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting review:', error)
      return NextResponse.json(
        { error: 'Failed to delete review' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/reviews/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
