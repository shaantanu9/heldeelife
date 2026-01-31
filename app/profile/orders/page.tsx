'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
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
  TrendingUp,
  CheckCircle2,
  MapPin,
  Search,
  Filter,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  total_amount: number
  order_items: OrderItem[]
  created_at: string
  shipping_address: any
}

export default function OrdersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchOrders()
  }, [session, router])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (!response.ok) throw new Error('Failed to fetch orders')
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-purple-100 text-purple-800'
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate order statistics (Social Proof)
  const totalSpent = orders.reduce(
    (sum, order) =>
      sum +
      (order.payment_status === 'paid' ? Number(order.total_amount) : 0),
    0
  )
  const pendingCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'processing'
  ).length
  const deliveredCount = orders.filter(
    (o) => o.status === 'delivered'
  ).length

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query) ||
          order.order_items?.some((item) =>
            item.product_name.toLowerCase().includes(query)
          )
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(
        (order) => order.payment_status === paymentFilter
      )
    }

    // Sort orders
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          )
        case 'oldest':
          return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
          )
        case 'amount-high':
          return Number(b.total_amount) - Number(a.total_amount)
        case 'amount-low':
          return Number(a.total_amount) - Number(b.total_amount)
        default:
          return 0
      }
    })

    return sorted
  }, [orders, searchQuery, statusFilter, paymentFilter, sortBy])

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    paymentFilter !== 'all'

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setSortBy('newest')
  }

  if (loading) {
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

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Order History
          </h1>
          <p className="text-gray-600">
            Track and manage all your orders in one place
          </p>
        </div>

        {/* Filters and Search */}
        {orders.length > 0 && (
          <Card className="border border-gray-200 shadow-md bg-white mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by order number or product..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-lg"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                {/* Payment Filter */}
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="amount-high">Amount: High to Low</SelectItem>
                    <SelectItem value="amount-low">Amount: Low to High</SelectItem>
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full md:w-auto"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Results Count */}
              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {filteredAndSortedOrders.length} of {orders.length}{' '}
                    orders
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Statistics (Social Proof) */}
        {orders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border border-gray-200 shadow-md bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {orders.length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Package className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-md bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">
                      Rs. {Math.round(totalSpent).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-md bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Delivered</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {deliveredCount}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {orders.length === 0 ? (
          <Card className="border border-gray-200 shadow-xl bg-white">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No orders yet
              </h2>
              <p className="text-gray-600 mb-6">
                Start shopping to see your orders here
              </p>
              <Button
                asChild
                className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Link href="/shop">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredAndSortedOrders.length === 0 ? (
              <Card className="border border-gray-200 shadow-xl bg-white">
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    No orders found
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {hasActiveFilters
                      ? 'Try adjusting your filters to see more orders'
                      : 'Start shopping to see your orders here'}
                  </p>
                  {hasActiveFilters ? (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="rounded-lg"
                    >
                      Clear Filters
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Link href="/shop">Start Shopping</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredAndSortedOrders.map((order) => (
              <Card
                key={order.id}
                className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white"
              >
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-gray-900">
                          Order #{order.order_number}
                        </CardTitle>
                        <Badge
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
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
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-orange-600">
                        Rs. {Number(order.total_amount).toFixed(2)}
                      </p>
                      {order.payment_status === 'paid' && (
                        <Badge className="mt-2 bg-green-100 text-green-800">
                          Paid
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Items ({order.order_items?.length || 0})
                    </p>
                    {order.order_items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {item.product_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity} × Rs.{' '}
                            {Number(item.unit_price).toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          Rs. {Number(item.total_price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  {order.shipping_address && (
                    <div className="pt-4 border-t border-gray-200 mb-4">
                      <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Shipping Address:
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.shipping_address.name}
                        <br />
                        {order.shipping_address.address}
                        {order.shipping_address.addressLine2 && (
                          <>
                            <br />
                            {order.shipping_address.addressLine2}
                          </>
                        )}
                        <br />
                        {order.shipping_address.city},{' '}
                        {order.shipping_address.state}{' '}
                        {order.shipping_address.pincode}
                      </p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      asChild
                      className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Link href={`/profile/orders/${order.id}`}>
                        <Package className="h-4 w-4 mr-2" />
                        Track Order
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
