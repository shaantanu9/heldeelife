import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createCachedResponse } from '@/lib/utils/cache-headers'
import { REVALIDATE_TIMES } from '@/lib/constants'
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'


// GET /api/reviews - Get reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const approved = searchParams.get('approved') !== 'false' // Default to true

    let query = supabaseAdmin
      .from('product_reviews')
      .select(
        `
        *,
        products (
          id,
          name
        )
      `
      )
      .order('created_at', { ascending: false })

    if (productId) {
      query = query.eq('product_id', productId)
    }

    // Public can only see approved reviews
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      query = query.eq('moderation_status', 'approved')
    } else if (!approved) {
      // Admin can filter by moderation status
      const status = searchParams.get('status') || 'pending'
      query = query.eq('moderation_status', status)
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    // Fetch user data separately for each review
    if (reviews && reviews.length > 0) {
      const userIds = [
        ...new Set(reviews.map((r: any) => r.user_id).filter(Boolean)),
      ]

      if (userIds.length > 0) {
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds)

        const usersMap = new Map(users?.map((u: any) => [u.id, u]) || [])

        // Attach user data to reviews
        const reviewsWithUsers = reviews.map((review: any) => ({
          ...review,
          users: usersMap.get(review.user_id) || null,
        }))

        // Cache reviews for 10 minutes
        return createCachedResponse(
          { reviews: reviewsWithUsers },
          {
            public: true,
            maxAge: REVALIDATE_TIMES.reviews, // 10 minutes
            staleWhileRevalidate: 600, // 10 minutes
            mustRevalidate: false,
          }
        )
      }
    }

    // Cache reviews for 10 minutes
    return createCachedResponse(
      { reviews: reviews || [] },
      {
        public: true,
        maxAge: REVALIDATE_TIMES.reviews, // 10 minutes
        staleWhileRevalidate: 600, // 10 minutes
        mustRevalidate: false,
      }
    )
  } catch (error) {
    console.error('Error in GET /api/reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 5 reviews per 10 minutes
    const ip = getRateLimitIdentifier(request)
    const rateLimitResult = await rateLimit(`reviews:${session.user.id || ip}`, 5, 600)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many reviews. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { product_id, order_id, rating, review_images } = body

    // Sanitize text fields to prevent XSS
    const title = body.title ? body.title.replace(/<[^>]*>/g, '').trim() : null
    const comment = body.comment ? body.comment.replace(/<[^>]*>/g, '').trim() : null

    if (!product_id || !rating) {
      return NextResponse.json(
        { error: 'Product ID and rating are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Validate review images (max 5 images)
    if (
      review_images &&
      Array.isArray(review_images) &&
      review_images.length > 5
    ) {
      return NextResponse.json(
        { error: 'Maximum 5 images allowed per review' },
        { status: 400 }
      )
    }

    // Check if user already reviewed this product
    const { data: existing } = await supabaseAdmin
      .from('product_reviews')
      .select('id')
      .eq('product_id', product_id)
      .eq('user_id', session.user.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      )
    }

    // Check if order_id is valid (for verified purchase)
    let isVerifiedPurchase = false
    if (order_id) {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id, user_id, status')
        .eq('id', order_id)
        .eq('user_id', session.user.id)
        .single()

      if (
        order &&
        (order.status === 'delivered' || order.status === 'shipped')
      ) {
        isVerifiedPurchase = true
      }
    }

    const { data: review, error } = await supabaseAdmin
      .from('product_reviews')
      .insert({
        product_id,
        user_id: session.user.id,
        order_id: order_id || null,
        rating,
        title,
        comment,
        review_images:
          review_images && review_images.length > 0 ? review_images : null,
        is_verified_purchase: isVerifiedPurchase,
        is_approved: false, // Legacy field, will be migrated to moderation_status
        moderation_status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating review:', error)
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      )
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
