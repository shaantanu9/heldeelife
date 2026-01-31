import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createCachedResponse } from '@/lib/utils/cache-headers'
import { REVALIDATE_TIMES } from '@/lib/constants'

// Route segment config - analytics cache for 5 minutes
export const revalidate = REVALIDATE_TIMES.analytics

// GET /api/admin/analytics - Get analytics data (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const period = searchParams.get('period') || '30' // days

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - parseInt(period) * 24 * 60 * 60 * 1000)

    // Sales Analytics
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('total_amount, status, created_at, payment_status')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
    }

    const totalRevenue =
      orders
        ?.filter((o) => o.status === 'delivered' || o.status === 'shipped')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0

    const totalOrders = orders?.length || 0
    const pendingOrders =
      orders?.filter((o) => o.status === 'pending').length || 0
    const completedOrders =
      orders?.filter((o) => o.status === 'delivered').length || 0
    const cancelledOrders =
      orders?.filter((o) => o.status === 'cancelled').length || 0

    // Product Analytics
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, sales_count, views_count, rating, reviews_count')
      .eq('is_active', true)
      .order('sales_count', { ascending: false })
      .limit(10)

    if (productsError) {
      console.error('Error fetching products:', productsError)
    }

    // Inventory Analytics
    const { data: inventory, error: inventoryError } = await supabaseAdmin
      .from('inventory')
      .select('available_quantity, low_stock_threshold, product_id')
      .gt('available_quantity', 0)

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError)
    }

    const lowStockCount =
      inventory?.filter(
        (inv) => inv.available_quantity <= inv.low_stock_threshold
      ).length || 0
    const outOfStockCount =
      inventory?.filter((inv) => inv.available_quantity === 0).length || 0

    // User Analytics
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, created_at')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    if (usersError) {
      console.error('Error fetching users:', usersError)
    }

    const newUsers = users?.length || 0

    // Revenue by day (for chart)
    const revenueByDay: Record<string, number> = {}
    orders?.forEach((order) => {
      if (order.status === 'delivered' || order.status === 'shipped') {
        const date = new Date(order.created_at).toISOString().split('T')[0]
        revenueByDay[date] =
          (revenueByDay[date] || 0) + Number(order.total_amount)
      }
    })

    // Top selling products
    const { data: orderItems, error: orderItemsError } = await supabaseAdmin
      .from('order_items')
      .select(
        `
        product_id,
        quantity,
        total_price,
        products (
          id,
          name,
          image
        )
      `
      )
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError)
    }

    const productSales: Record<
      string,
      {
        product_id: string
        name: string
        image: string
        quantity: number
        revenue: number
      }
    > = {}

    orderItems?.forEach((item: any) => {
      const productId = item.product_id
      if (!productSales[productId]) {
        productSales[productId] = {
          product_id: productId,
          name: item.products?.name || 'Unknown',
          image: item.products?.image || '',
          quantity: 0,
          revenue: 0,
        }
      }
      productSales[productId].quantity += item.quantity
      productSales[productId].revenue += Number(item.total_price)
    })

    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Advanced Analytics: Order Patterns
    const orderPatterns = {
      byDayOfWeek: {} as Record<string, number>,
      byHourOfDay: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byPaymentMethod: {} as Record<string, number>,
    }

    orders?.forEach((order) => {
      const date = new Date(order.created_at)
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
      const hour = date.getHours().toString()

      // Day of week
      orderPatterns.byDayOfWeek[dayOfWeek] =
        (orderPatterns.byDayOfWeek[dayOfWeek] || 0) + 1

      // Hour of day
      orderPatterns.byHourOfDay[hour] =
        (orderPatterns.byHourOfDay[hour] || 0) + 1

      // Status distribution
      orderPatterns.byStatus[order.status] =
        (orderPatterns.byStatus[order.status] || 0) + 1

      // Payment method distribution
      const paymentMethod = order.payment_method || 'unknown'
      orderPatterns.byPaymentMethod[paymentMethod] =
        (orderPatterns.byPaymentMethod[paymentMethod] || 0) + 1
    })

    // Calculate Average Order Value (AOV)
    const paidOrders = orders?.filter(
      (o) => o.payment_status === 'paid' && o.status !== 'cancelled'
    ) || []
    const aov = paidOrders.length > 0
      ? paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) /
        paidOrders.length
      : 0

    // Calculate AOV by day for trend
    const aovByDay: Record<string, { revenue: number; count: number }> = {}
    paidOrders.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      if (!aovByDay[date]) {
        aovByDay[date] = { revenue: 0, count: 0 }
      }
      aovByDay[date].revenue += Number(order.total_amount || 0)
      aovByDay[date].count += 1
    })

    const aovTrend = Object.entries(aovByDay).map(([date, data]) => ({
      date,
      aov: data.count > 0 ? data.revenue / data.count : 0,
    }))

    // Customer Analytics
    const { data: allUsers, error: usersError2 } = await supabaseAdmin
      .from('users')
      .select('id, created_at')

    const totalUsers = allUsers?.length || 0
    const conversionRate =
      totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0

    // Repeat purchase rate
    const { data: userOrders, error: userOrdersError } = await supabaseAdmin
      .from('orders')
      .select('user_id, payment_status, status')
      .eq('payment_status', 'paid')
      .neq('status', 'cancelled')

    const userOrderCounts: Record<string, number> = {}
    userOrders?.forEach((order) => {
      if (order.user_id) {
        userOrderCounts[order.user_id] =
          (userOrderCounts[order.user_id] || 0) + 1
      }
    })

    const repeatCustomers = Object.values(userOrderCounts).filter(
      (count) => count > 1
    ).length
    const repeatPurchaseRate =
      totalUsers > 0 ? (repeatCustomers / totalUsers) * 100 : 0

    // Customer Lifetime Value (simplified - average revenue per customer)
    const totalPaidRevenue = paidOrders.reduce(
      (sum, o) => sum + Number(o.total_amount || 0),
      0
    )
    const customersWithOrders = new Set(
      paidOrders.map((o) => o.user_id).filter(Boolean)
    ).size
    const customerLTV =
      customersWithOrders > 0 ? totalPaidRevenue / customersWithOrders : 0

    // Order fulfillment metrics
    const shippedOrders = orders?.filter((o) => o.status === 'shipped') || []
    const deliveredOrders = orders?.filter((o) => o.status === 'delivered') || []

    // Calculate average fulfillment time (simplified)
    let totalFulfillmentTime = 0
    let fulfillmentCount = 0
    deliveredOrders.forEach((order) => {
      if (order.created_at && order.delivered_at) {
        const created = new Date(order.created_at)
        const delivered = new Date(order.delivered_at)
        const days = (delivered.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        totalFulfillmentTime += days
        fulfillmentCount += 1
      }
    })
    const avgFulfillmentTime =
      fulfillmentCount > 0 ? totalFulfillmentTime / fulfillmentCount : 0

    return NextResponse.json({
      analytics: {
        revenue: {
          total: totalRevenue,
          byDay: revenueByDay,
          averageOrderValue: aov,
          aovTrend,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
          patterns: orderPatterns,
          avgFulfillmentTime: Math.round(avgFulfillmentTime * 10) / 10,
        },
        products: {
          topSelling: topSellingProducts,
          topRated: products?.slice(0, 10) || [],
        },
        inventory: {
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
          totalProducts: products?.length || 0,
        },
        users: {
          new: newUsers,
          total: totalUsers,
          conversionRate: Math.round(conversionRate * 100) / 100,
          repeatPurchaseRate: Math.round(repeatPurchaseRate * 100) / 100,
          customerLTV: Math.round(customerLTV * 100) / 100,
        },
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    }

    // Cache analytics for 5 minutes (admin-only, private cache)
    return createCachedResponse(
      analyticsData,
      {
        public: false,
        maxAge: REVALIDATE_TIMES.analytics, // 5 minutes
        staleWhileRevalidate: 300, // 5 minutes
        mustRevalidate: false,
      }
    )
  } catch (error) {
    console.error('Error in GET /api/admin/analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

