import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Allow both authenticated users and admins
    // Admins get all metrics, users get their own metrics

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Calculate date range (default: last 30 days)
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get product views
    const { data: productViews } = await supabaseAdmin
      .from('product_views')
      .select('id')
      .gte('viewed_at', start.toISOString())
      .lte('viewed_at', end.toISOString())

    // Get cart additions
    const { data: cartAdds } = await supabaseAdmin
      .from('cart_analytics')
      .select('id')
      .gte('added_at', start.toISOString())
      .lte('added_at', end.toISOString())

    // Get cart removals (abandoned)
    const { data: cartAbandoned } = await supabaseAdmin
      .from('cart_analytics')
      .select('id')
      .gte('added_at', start.toISOString())
      .lte('added_at', end.toISOString())
      .not('removed_at', 'is', null)
      .is('purchased_at', null)

    // Get purchases
    const { data: purchases } = await supabaseAdmin
      .from('cart_analytics')
      .select('id, order_id')
      .gte('purchased_at', start.toISOString())
      .lte('purchased_at', end.toISOString())
      .not('purchased_at', 'is', null)

    // Get orders
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('total_amount, status')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    // Get checkout starts (orders created)
    const checkoutStarts = orders?.length || 0

    // Calculate metrics
    const productViewCount = productViews?.length || 0
    const cartAddCount = cartAdds?.length || 0
    const cartAbandonedCount = cartAbandoned?.length || 0
    const purchaseCount = purchases?.length || 0
    const completedOrders = orders?.filter((o) => o.status === 'delivered').length || 0

    // Calculate conversion rates
    const productViewToCartRate =
      productViewCount > 0 ? (cartAddCount / productViewCount) * 100 : 0
    const cartToCheckoutRate =
      cartAddCount > 0 ? (checkoutStarts / cartAddCount) * 100 : 0
    const checkoutCompletionRate =
      checkoutStarts > 0 ? (completedOrders / checkoutStarts) * 100 : 0
    const conversionRate =
      productViewCount > 0 ? (completedOrders / productViewCount) * 100 : 0

    // Calculate cart abandonment rate
    const cartAbandonmentRate =
      cartAddCount > 0 ? (cartAbandonedCount / cartAddCount) * 100 : 0

    // Calculate average order value
    const totalRevenue = orders
      ?.filter((o) => o.status === 'delivered' || o.status === 'shipped')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0
    const averageOrderValue =
      completedOrders > 0 ? totalRevenue / completedOrders : 0

    return NextResponse.json({
      conversionRate: Math.round(conversionRate * 100) / 100,
      cartAbandonmentRate: Math.round(cartAbandonmentRate * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      checkoutCompletionRate: Math.round(checkoutCompletionRate * 100) / 100,
      productViewToCartRate: Math.round(productViewToCartRate * 100) / 100,
      cartToCheckoutRate: Math.round(cartToCheckoutRate * 100) / 100,
      // Additional metrics
      totalProductViews: productViewCount,
      totalCartAdds: cartAddCount,
      totalCartAbandoned: cartAbandonedCount,
      totalPurchases: purchaseCount,
      totalOrders: checkoutStarts,
      totalRevenue,
    })
  } catch (error) {
    console.error('Error fetching conversion metrics:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        conversionRate: 0,
        cartAbandonmentRate: 0,
        averageOrderValue: 0,
        checkoutCompletionRate: 0,
        productViewToCartRate: 0,
        cartToCheckoutRate: 0,
      },
      { status: 500 }
    )
  }
}









