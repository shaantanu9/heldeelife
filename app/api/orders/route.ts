import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'
import { computeOrderTotals } from '@/lib/commerce/totals'
import { createOrderAccessToken } from '@/lib/commerce/order-access'
import { validateCouponForOrder } from '@/lib/commerce/coupons'
import { isPaymentGatewayConfigured } from '@/lib/commerce/razorpay'

// GET /api/orders - Get orders (user's own or all for admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('payment_status')
    const search = searchParams.get('search') // Search by order number, customer name, email
    const productId = searchParams.get('product_id')
    const month = searchParams.get('month') // Format: YYYY-MM
    const day = searchParams.get('day') // Format: YYYY-MM-DD
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const scope = searchParams.get('scope')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') || '50') || 50)
    )
    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('orders')
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          product_name,
          product_sku,
          product_image,
          quantity,
          unit_price,
          total_price,
          discount_amount
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    // Users only see their own orders. Admins see all, unless a customer-facing
    // page asks for scope=mine ("My Orders" for an admin's own account).
    if (session.user.role !== 'admin' || scope === 'mine') {
      query = query.eq('user_id', session.user.id)
    }

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query = query.eq('payment_status', paymentStatus)
    }

    // Search functionality (order number, customer name, email)
    if (search) {
      // Strip PostgREST filter syntax characters so input can't break or
      // extend the .or() expression.
      const term = search.replace(/[,()*%\\]/g, ' ').trim()
      if (term) {
        query = query.or(
          `order_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_email.ilike.%${term}%`
        )
      }
    }

    // Date filters
    if (day) {
      const dayStart = new Date(day)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)
      query = query
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString())
    } else if (month) {
      const monthStart = new Date(`${month}-01`)
      monthStart.setHours(0, 0, 0, 0)
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      monthEnd.setDate(0) // Last day of month
      monthEnd.setHours(23, 59, 59, 999)
      query = query
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
    } else if (startDate && endDate) {
      query = query
        .gte('created_at', new Date(startDate).toISOString())
        .lte('created_at', new Date(endDate).toISOString())
    }

    // Product filter (filter by product_id in order_items)
    // Note: This requires a subquery, so we'll filter after fetching

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: orders, error, count } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    let filteredOrders = orders || []

    // Apply product filter if specified (filter by product_id in order_items)
    if (productId) {
      filteredOrders = filteredOrders.filter((order) =>
        order.order_items?.some((item: any) => item.product_id === productId)
      )
    }

    // Calculate total pages
    const totalPages = count ? Math.ceil(count / limit) : 1

    // Per-user data: never cache (a shared browser would otherwise serve one
    // account's orders to the next, and lists go stale after cancellations).
    return NextResponse.json(
      {
        orders: filteredOrders,
        pagination: {
          page,
          limit,
          total: count || filteredOrders.length,
          totalPages,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('Error in GET /api/orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create new order (authenticated or guest)
//
// Security model: the client only says WHAT it wants (product ids,
// quantities, address, payment method, coupon code). Every price, discount,
// shipping fee and total is computed here from the database, and stock +
// coupon limits are enforced atomically by the place_order() SQL function.
const addressSchema = z
  .object({
    name: z.string().trim().max(120).optional(),
    full_name: z.string().trim().max(120).optional(),
    email: z.string().trim().max(254).optional(),
    phone: z.string().trim().max(20).optional(),
  })
  .passthrough()

const orderSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid().optional(),
        id: z.string().uuid().optional(),
        quantity: z.coerce.number().int().min(1).max(100),
      })
    )
    .min(1, 'Order items are required')
    .max(50),
  shipping_address: addressSchema,
  billing_address: addressSchema.optional().nullable(),
  payment_method: z.enum(['cod', 'online']).default('cod'),
  coupon_code: z.string().trim().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const parsed = orderSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return NextResponse.json(
        {
          error:
            issue?.path[0] === 'items'
              ? 'Order items are required'
              : issue?.path[0] === 'shipping_address'
                ? 'Shipping address is required'
                : issue?.message || 'Invalid order',
        },
        { status: 400 }
      )
    }
    const {
      shipping_address,
      billing_address,
      payment_method,
      coupon_code,
      notes,
    } = parsed.data

    const customerName =
      shipping_address.name ?? shipping_address.full_name ?? null
    const customerEmail = shipping_address.email ?? session?.user?.email ?? null
    const customerPhone = shipping_address.phone ?? null

    if (!session?.user && (!customerName || !customerEmail || !customerPhone)) {
      return NextResponse.json(
        {
          error:
            'Guest checkout requires name, email, and phone in shipping address',
        },
        { status: 400 }
      )
    }

    if (payment_method === 'online' && !isPaymentGatewayConfigured()) {
      return NextResponse.json(
        {
          error:
            'Online payment is currently unavailable. Please choose Cash on Delivery.',
        },
        { status: 400 }
      )
    }

    // Merge duplicate lines and collect quantities per product
    const quantities = new Map<string, number>()
    for (const item of parsed.data.items) {
      const productId = item.product_id || item.id
      if (!productId) {
        return NextResponse.json(
          { error: 'Each item needs a product_id' },
          { status: 400 }
        )
      }
      quantities.set(
        productId,
        (quantities.get(productId) || 0) + item.quantity
      )
    }

    // Authoritative product data (price, name, availability)
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, sku, price, image, images, is_active, category_id')
      .in('id', [...quantities.keys()])

    if (productsError) {
      console.error('Error loading products for order:', productsError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    const byId = new Map((products || []).map((p) => [p.id, p]))
    for (const productId of quantities.keys()) {
      const product = byId.get(productId)
      if (!product) {
        return NextResponse.json(
          { error: `Product ${productId} not found` },
          { status: 400 }
        )
      }
      if (!product.is_active) {
        return NextResponse.json(
          { error: `Product ${product.name} is no longer available` },
          { status: 400 }
        )
      }
    }

    const orderItems = [...quantities.entries()].map(
      ([productId, quantity]) => {
        const product = byId.get(productId)!
        const unitPrice = Number(product.price)
        return {
          product_id: productId,
          product_name: product.name,
          product_sku: product.sku || null,
          product_image: product.image || product.images?.[0] || null,
          category_id: product.category_id as string | null,
          quantity,
          unit_price: unitPrice,
          total_price: Math.round(unitPrice * quantity * 100) / 100,
        }
      }
    )
    const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0)

    // Coupon: validated server-side against the real subtotal
    let couponId: string | null = null
    let discount = 0
    if (coupon_code) {
      const coupon = await validateCouponForOrder(coupon_code, {
        userId: session?.user?.id ?? null,
        subtotal,
        productIds: orderItems.map((i) => i.product_id),
        categoryIds: orderItems
          .map((i) => i.category_id)
          .filter((c): c is string => Boolean(c)),
      })
      if (!coupon.valid) {
        return NextResponse.json(
          { error: coupon.error || 'Invalid coupon code' },
          { status: 400 }
        )
      }
      couponId = coupon.couponId
      discount = coupon.discount
    }

    const totals = computeOrderTotals(subtotal, discount)

    // Opportunistically release stock held by abandoned online payments
    supabaseAdmin
      .rpc('expire_stale_online_orders', { p_minutes: 60 })
      .then(({ error }) => {
        if (error) console.error('expire_stale_online_orders failed:', error)
      })

    const { data: placed, error: placeError } = await supabaseAdmin.rpc(
      'place_order',
      {
        p_order: {
          user_id: session?.user?.id ?? null,
          shipping_address,
          billing_address: billing_address || shipping_address,
          payment_method,
          subtotal: totals.subtotal,
          tax_amount: totals.tax,
          shipping_amount: totals.shipping,
          discount_amount: totals.discount,
          total_amount: totals.total,
          notes: notes || null,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          coupon_id: couponId,
        },
        p_items: orderItems.map(({ category_id: _c, ...item }) => item),
      }
    )

    if (placeError || !placed) {
      const message = placeError?.message || ''
      if (message.includes('OUT_OF_STOCK:')) {
        const [, name, available] =
          message.match(/OUT_OF_STOCK:(.*):(\d+)/) || []
        return NextResponse.json(
          {
            error: `Insufficient stock for ${name || 'an item'}. Available: ${available ?? 0}`,
          },
          { status: 409 }
        )
      }
      if (message.includes('COUPON_EXHAUSTED')) {
        return NextResponse.json(
          { error: 'This coupon has reached its usage limit' },
          { status: 409 }
        )
      }
      console.error('Error creating order:', placeError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    const orderId = (placed as { id: string }).id
    const { data: completeOrder } = await supabaseAdmin
      .from('orders')
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          product_name,
          product_sku,
          product_image,
          quantity,
          unit_price,
          total_price
        )
      `
      )
      .eq('id', orderId)
      .single()

    return NextResponse.json(
      {
        order: completeOrder,
        // Lets a guest pay for / view / track this order without a session
        access_token: createOrderAccessToken(orderId),
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('Error in POST /api/orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
