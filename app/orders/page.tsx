'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useOrderContext } from '@/contexts/order-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Package,
  ArrowLeft,
  Filter,
  Search,
  Calendar,
  DollarSign,
} from 'lucide-react'
import Link from 'next/link'
import { OrderStatusBadge, OrderItemCard } from '@/components/orders'

export default function OrdersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const {
    orders,
    isLoadingOrders,
    ordersError,
    orderFilters,
    setOrderFilters,
    orderStats,
  } = useOrderContext()

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, router])

  const [searchQuery, setSearchQuery] = useState('')

  // Filter orders by search query
  const filteredOrders = useMemo(() => {
    if (!orders) return []
    if (!searchQuery.trim()) return orders

    const query = searchQuery.toLowerCase()
    return orders.filter(
      (order) =>
        (order as any).order_number?.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query)
    )
  }, [orders, searchQuery])

  if (!session) {
    return null
  }

  if (isLoadingOrders) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-24">
        <div className="container px-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        </div>
      </div>
    )
  }

  if (ordersError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-24">
        <div className="container px-4">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <p className="text-red-600 mb-4">Error loading orders</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Orders</h1>
        </div>

        {/* Order Stats */}
        {orderStats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {orderStats.total}
                </p>
                <p className="text-sm text-gray-600">Total</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {orderStats.pending}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {orderStats.processing}
                </p>
                <p className="text-sm text-gray-600">Processing</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {orderStats.shipped}
                </p>
                <p className="text-sm text-gray-600">Shipped</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {orderStats.delivered}
                </p>
                <p className="text-sm text-gray-600">Delivered</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {orderStats.cancelled}
                </p>
                <p className="text-sm text-gray-600">Cancelled</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="border border-gray-200 shadow-md bg-white mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by order number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-600" />
                <Select
                  value={orderFilters.status || 'all'}
                  onValueChange={(value) => {
                    setOrderFilters({
                      status: value === 'all' ? undefined : value,
                    })
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {!orders || orders.length === 0 ? (
          <Card className="border border-gray-200 shadow-xl bg-white">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No orders found
              </h2>
              <p className="text-gray-600 mb-6">
                {orderFilters.status
                  ? `No ${orderFilters.status} orders found`
                  : 'Start shopping to see your orders here'}
              </p>
              <Button
                asChild
                className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Link href="/shop">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card className="border border-gray-200 shadow-xl bg-white">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No orders found
              </h2>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? 'No orders match your search criteria'
                  : 'No orders found with the selected filter'}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2 flex-wrap">
                        <CardTitle className="text-gray-900">
                          Order #
                          {(order as any).order_number ||
                            order.id.slice(0, 8).toUpperCase()}
                        </CardTitle>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(order.created_at).toLocaleDateString(
                              'en-IN',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold text-gray-900">
                            Rs. {Number(order.total_amount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    {order.order_items?.slice(0, 3).map((item) => (
                      <OrderItemCard key={item.id} item={item} compact />
                    ))}
                    {order.order_items && order.order_items.length > 3 && (
                      <p className="text-sm text-gray-600 text-center">
                        +{order.order_items.length - 3} more item(s)
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/orders/${order.id}`}>View Details</Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/tracking?orderId=${order.id}`}>
                        Track Order
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
