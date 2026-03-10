import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { VALIDATION } from '@/lib/constants'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 requests per 5 minutes per IP
    const ip = getRateLimitIdentifier(request)
    const rateLimitResult = await rateLimit(`abandoned-cart:${ip}`, 10, 300)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)) } }
      )
    }

    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { cart, email } = body

    if (!cart || !email) {
      return NextResponse.json(
        { error: 'Cart and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!VALIDATION.emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate cart structure
    if (!cart.items || !Array.isArray(cart.items) || typeof cart.totalPrice !== 'number') {
      return NextResponse.json(
        { error: 'Invalid cart structure' },
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

    // Trigger re-engagement email (non-blocking: email failure does not roll back the DB insert)
    try {
      const from = process.env.RESEND_FROM_EMAIL || 'noreply@heldeelife.com'
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'
      await resend.emails.send({
        from,
        to: email,
        subject: 'You left something behind... 🛒',
        html: `<p>You left ${itemCount} item(s) in your cart. <a href="${siteUrl}/cart">Complete your order</a>.</p>`,
      })
    } catch (emailErr) {
      console.error('Failed to send abandoned cart email for cart', data.id, ':', emailErr)
    }

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

