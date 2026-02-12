import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createCachedResponse } from '@/lib/utils/cache-headers'
import { REVALIDATE_TIMES } from '@/lib/constants'


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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
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

    // Users can only see their own orders, admins can see all
    if (session.user.role !== 'admin') {
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
      query = query.or(
        `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`
      )
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

    // Use private caching for user-specific data (2 minutes, browser-only)
    return createCachedResponse(
      {
        orders: filteredOrders,
        pagination: {
          page,
          limit,
          total: count || filteredOrders.length,
          totalPages,
        },
      },
      {
        public: false, // Private cache (user-specific)
        maxAge: REVALIDATE_TIMES.orders, // 2 minutes
        staleWhileRevalidate: 300, // 5 minutes
        mustRevalidate: false,
      }
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
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const body = await request.json()
    const {
      items,
      shipping_address,
      billing_address,
      payment_method = 'cod',
      subtotal,
      tax_amount = 0,
      shipping_amount = 0,
      discount_amount = 0,
      coupon_id,
      notes,
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      )
    }

    if (!shipping_address) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      )
    }

    const isGuest = !session?.user
    if (isGuest) {
      const name =
        shipping_address.name ?? shipping_address.full_name ?? null
      const email = shipping_address.email ?? null
      const phone = shipping_address.phone ?? null
      if (!name || !email || !phone) {
        return NextResponse.json(
          {
            error:
              'Guest checkout requires name, email, and phone in shipping address',
          },
          { status: 400 }
        )
      }
    }

    // Validate product availability and stock
    for (const item of items) {
      const productId = item.product_id || item.id
      if (!productId) continue

      // Check product exists and is active
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, name, is_active')
        .eq('id', productId)
        .single()

      if (productError || !product) {
        return NextResponse.json(
          { error: `Product ${item.name || productId} not found` },
          { status: 400 }
        )
      }

      if (!product.is_active) {
        return NextResponse.json(
          { error: `Product ${product.name} is no longer available` },
          { status: 400 }
        )
      }

      // Check inventory availability
      const { data: inventory } = await supabaseAdmin
        .from('inventory')
        .select('quantity, reserved_quantity')
        .eq('product_id', productId)
        .single()

      if (inventory) {
        const availableQuantity =
          inventory.quantity - (inventory.reserved_quantity || 0)
        if (availableQuantity < item.quantity) {
          return NextResponse.json(
            {
              error: `Insufficient stock for ${product.name}. Available: ${availableQuantity}, Requested: ${item.quantity}`,
            },
            { status: 400 }
          )
        }
      }
    }

    // Calculate total
    const total_amount =
      subtotal + tax_amount + shipping_amount - discount_amount

    const customerName =
      shipping_address.name ?? shipping_address.full_name ?? null
    const customerEmail = shipping_address.email ?? null
    const customerPhone = shipping_address.phone ?? null

    // Create order (user_id null for guest checkout)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: session?.user?.id ?? null,
        shipping_address,
        billing_address: billing_address || shipping_address,
        payment_method,
        subtotal,
        tax_amount,
        shipping_amount,
        discount_amount,
        total_amount,
        notes,
        status: 'pending',
        payment_status: payment_method === 'cod' ? 'pending' : 'pending',
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Create order items with product images
    const orderItems = await Promise.all(
      items.map(async (item: any) => {
        const productId = item.product_id || item.id
        let productImage = item.image || item.product_image || null

        // Fetch product image if not provided
        if (!productImage && productId) {
          const { data: product } = await supabaseAdmin
            .from('products')
            .select('image, images')
            .eq('id', productId)
            .single()

          if (product) {
            productImage = product.image || product.images?.[0] || null
          }
        }

        return {
          order_id: order.id,
          product_id: productId,
          product_name: item.name || item.product_name,
          product_sku: item.sku || item.product_sku || null,
          product_image: productImage,
          quantity: item.quantity,
          unit_price: item.price || item.unit_price,
          total_price: (item.price || item.unit_price) * item.quantity,
          discount_amount: item.discount_amount || 0,
        }
      })
    )

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Rollback order if items fail
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      )
    }

    // Record coupon usage if coupon was applied (authenticated users only)
    if (coupon_id && discount_amount > 0 && session?.user?.id) {
      try {
        const { error: usageError } = await supabaseAdmin
          .from('coupon_usage')
          .insert({
            coupon_id,
            user_id: session.user.id,
            order_id: order.id,
            discount_amount,
          })

        if (usageError) {
          // Log error but don't fail the order if coupon usage recording fails
          // (coupon might have been used already, or there's a constraint issue)
          console.error('Error recording coupon usage:', usageError)
        } else {
          // Increment coupon used count
          const { data: coupon, error: fetchError } = await supabaseAdmin
            .from('coupons')
            .select('used_count')
            .eq('id', coupon_id)
            .single()

          if (!fetchError && coupon) {
            const { error: updateError } = await supabaseAdmin
              .from('coupons')
              .update({
                used_count: (coupon.used_count || 0) + 1,
              })
              .eq('id', coupon_id)

            if (updateError) {
              console.error(
                'Error incrementing coupon used count:',
                updateError
              )
            }
          }
        }
      } catch (error) {
        // Log error but don't fail the order
        console.error('Error processing coupon usage:', error)
      }
    }

    // Reserve inventory for all orders at creation time
    for (const item of items) {
      const productId = item.product_id || item.id
      if (productId) {
        const { data: inventory } = await supabaseAdmin
          .from('inventory')
          .select('id, quantity, reserved_quantity')
          .eq('product_id', productId)
          .single()

        if (inventory) {
          await supabaseAdmin
            .from('inventory')
            .update({
              reserved_quantity:
                (inventory.reserved_quantity || 0) + item.quantity,
            })
            .eq('id', inventory.id)
        }
      }
    }

    // Fetch complete order with items
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
          quantity,
          unit_price,
          total_price
        )
      `
      )
      .eq('id', order.id)
      .single()

    // New orders should not be cached
    return NextResponse.json({ order: completeOrder }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
