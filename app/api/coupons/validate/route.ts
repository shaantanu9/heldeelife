import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { validateCouponForOrder } from '@/lib/commerce/coupons'

const bodySchema = z.object({
  code: z.string().trim().min(1, 'Coupon code is required').max(50),
  // Preferred: the cart lines, so the subtotal is priced from the database
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.coerce.number().int().min(1).max(100),
      })
    )
    .max(50)
    .optional(),
  // Fallback for older clients
  subtotal: z.coerce.number().min(0).optional(),
})

// POST /api/coupons/validate - Validate a coupon for the current cart.
// Guests may validate coupons too (guest checkout is supported). The
// authoritative check happens again when the order is placed.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const limiter = await rateLimit(
      `coupon-validate:${session?.user?.id || getRateLimitIdentifier(request)}`,
      20,
      600
    )
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000))
            ),
          },
        }
      )
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      )
    }
    const { code, items, subtotal: clientSubtotal } = parsed.data

    let subtotal = clientSubtotal ?? 0
    let productIds: string[] = []
    let categoryIds: string[] = []

    if (items?.length) {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, price, category_id')
        .in(
          'id',
          items.map((i) => i.product_id)
        )
      const byId = new Map((products || []).map((p) => [p.id, p]))
      subtotal = items.reduce(
        (sum, item) =>
          sum + Number(byId.get(item.product_id)?.price || 0) * item.quantity,
        0
      )
      productIds = items.map((i) => i.product_id)
      categoryIds = (products || [])
        .map((p) => p.category_id)
        .filter((c): c is string => Boolean(c))
    }

    const result = await validateCouponForOrder(code, {
      userId: session?.user?.id ?? null,
      subtotal,
      productIds,
      categoryIds,
    })

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      coupon: { id: result.couponId, code: result.code, name: result.name },
      discount_amount: result.discount,
    })
  } catch (error) {
    console.error('Error validating coupon:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
