'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Download,
  FileText,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  DollarSign,
  Users,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { formatDateDisplay, getCurrentDateForFilename } from '@/lib/utils/date'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/contexts/toast-context'

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
  user_id: string
  status: string
  payment_status: string
  payment_method: string
  total_amount: number
  shipping_address: any
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  order_items: OrderItem[]
  created_at: string
}

interface OrderStats {
  total: number
  totalRevenue: number
  pending: number
  completed: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function AdminOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [generatingBill, setGeneratingBill] = useState<string | null>(null)
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    totalRevenue: 0,
    pending: 0,
    completed: 0,
  })
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
  const [productFilter, setProductFilter] = useState<string>('all')
  const [monthFilter, setMonthFilter] = useState<string>('')
  const [dayFilter, setDayFilter] = useState<string>('')
  const [startDateFilter, setStartDateFilter] = useState<string>('')
  const [endDateFilter, setEndDateFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const toast = useToast()

  // Fetch products for filter
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        const data = await response.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }
    fetchProducts()
  }, [])

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (paymentStatusFilter !== 'all') {
        params.append('payment_status', paymentStatusFilter)
      }
      if (productFilter !== 'all') {
        params.append('product_id', productFilter)
      }
      if (monthFilter) {
        params.append('month', monthFilter)
      }
      if (dayFilter) {
        params.append('day', dayFilter)
      }
      if (startDateFilter && endDateFilter) {
        params.append('start_date', startDateFilter)
        params.append('end_date', endDateFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())

      const queryString = params.toString()
      const url = `/api/orders${queryString ? `?${queryString}` : ''}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.orders) {
        setOrders(data.orders)
      }
      if (data.pagination) {
        setPagination(data.pagination)
      }

      // Calculate stats from current orders
      const totalRevenue = data.orders.reduce(
        (sum: number, order: Order) =>
          order.payment_status === 'paid' ? sum + Number(order.total_amount) : sum,
        0
      )
      const pending = data.orders.filter(
        (o: Order) => o.status === 'pending' || o.status === 'processing'
      ).length
      const completed = data.orders.filter(
        (o: Order) => o.status === 'delivered'
      ).length

      setStats({
        total: data.pagination?.total || data.orders.length,
        totalRevenue,
        pending,
        completed,
      })
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [
    statusFilter,
    paymentStatusFilter,
    productFilter,
    monthFilter,
    dayFilter,
    startDateFilter,
    endDateFilter,
    searchQuery,
    pagination.page,
    pagination.limit,
    toast,
  ])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (updatingStatus === orderId) return

    try {
      setUpdatingStatus(orderId)
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update order')

      toast.success('Order status updated')
      fetchOrders()
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleExportExcel = async () => {
    if (exporting) return

    try {
      setExporting(true)
      const params = new URLSearchParams()

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (paymentStatusFilter !== 'all') {
        params.append('payment_status', paymentStatusFilter)
      }
      if (productFilter !== 'all') {
        params.append('product_id', productFilter)
      }
      if (monthFilter) {
        params.append('month', monthFilter)
      }
      if (dayFilter) {
        params.append('day', dayFilter)
      }
      if (startDateFilter && endDateFilter) {
        params.append('start_date', startDateFilter)
        params.append('end_date', endDateFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const queryString = params.toString()
      const url = `/api/admin/export/orders${queryString ? `?${queryString}` : ''}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to export orders')

      const blob = await response.blob()
      const url_blob = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url_blob
      a.download = `orders_export_${getCurrentDateForFilename()}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url_blob)
      document.body.removeChild(a)
      toast.success('Orders exported successfully')
    } catch (error) {
      console.error('Error exporting orders:', error)
      toast.error('Failed to export orders')
    } finally {
      setExporting(false)
    }
  }

  const handleGenerateBill = async (orderId: string) => {
    if (generatingBill === orderId) return

    try {
      setGeneratingBill(orderId)
      const response = await fetch(`/api/admin/export/orders/${orderId}/bill`)
      if (!response.ok) throw new Error('Failed to generate bill')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice_${orders.find((o) => o.id === orderId)?.order_number || orderId}_${getCurrentDateForFilename()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Bill generated successfully')
    } catch (error) {
      console.error('Error generating bill:', error)
      toast.error('Failed to generate bill')
    } finally {
      setGeneratingBill(null)
    }
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setPaymentStatusFilter('all')
    setProductFilter('all')
    setMonthFilter('')
    setDayFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setSearchQuery('')
    setPagination((prev) => ({ ...prev, page: 1 }))
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Order <span className="text-orange-600">Management</span>
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Filters</CardTitle>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by order number, customer name, or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPagination((prev) => ({ ...prev, page: 1 }))
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="status">Order Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value)
                    setPagination((prev) => ({ ...prev, page: 1 }))
                  }}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Filter by status" />
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
              </div>

              <div>
                <Label htmlFor="payment_status">Payment Status</Label>
                <Select
                  value={paymentStatusFilter}
                  onValueChange={(value) => {
                    setPaymentStatusFilter(value)
                    setPagination((prev) => ({ ...prev, page: 1 }))
                  }}
                >
                  <SelectTrigger id="payment_status">
                    <SelectValue placeholder="Filter by payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="product">Product</Label>
                <Select
                  value={productFilter}
                  onValueChange={(value) => {
                    setProductFilter(value)
                    setPagination((prev) => ({ ...prev, page: 1 }))
                  }}
                >
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Filter by product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="month">Month (YYYY-MM)</Label>
                <Input
                  id="month"
                  type="month"
                  value={monthFilter}
                  onChange={(e) => {
                    setMonthFilter(e.target.value)
                    setDayFilter('')
                    setStartDateFilter('')
                    setEndDateFilter('')
                    setPagination((prev) => ({ ...prev, page: 1 }))
                  }}
                  placeholder="YYYY-MM"
                />
              </div>

              <div>
                <Label htmlFor="day">Day (YYYY-MM-DD)</Label>
                <Input
                  id="day"
                  type="date"
                  value={dayFilter}
                  onChange={(e) => {
                    setDayFilter(e.target.value)
                    setMonthFilter('')
                    setStartDateFilter('')
                    setEndDateFilter('')
                    setPagination((prev) => ({ ...prev, page: 1 }))
                  }}
                  placeholder="YYYY-MM-DD"
                />
              </div>

              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => {
                    setStartDateFilter(e.target.value)
                    setMonthFilter('')
                    setDayFilter('')
                    setPagination((prev) => ({ ...prev, page: 1 }))
                  }}
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => {
                    setEndDateFilter(e.target.value)
                    setMonthFilter('')
                    setDayFilter('')
                    setPagination((prev) => ({ ...prev, page: 1 }))
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Orders ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && orders.length > 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No orders found matching your filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.order_number}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {order.customer_name ||
                                order.shipping_address?.name ||
                                'N/A'}
                            </div>
                            {order.customer_email && (
                              <div className="text-xs text-gray-500">
                                {order.customer_email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{order.order_items?.length || 0} items</TableCell>
                        <TableCell>
                          ₹{Number(order.total_amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(value) =>
                              handleStatusUpdate(order.id, value)
                            }
                            disabled={updatingStatus === order.id}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                              {updatingStatus === order.id && (
                                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(order.payment_status)}>
                            {order.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateDisplay(order.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/admin/orders/${order.id}`}>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateBill(order.id)}
                              disabled={generatingBill === order.id}
                            >
                              {generatingBill === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} orders
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1),
                        }))
                      }
                      disabled={pagination.page === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.totalPages, prev.page + 1),
                        }))
                      }
                      disabled={pagination.page === pagination.totalPages || loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
