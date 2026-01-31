'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2,
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  User,
  FileText,
  Truck,
  Calendar,
  History,
  Save,
} from 'lucide-react'
import {
  formatDateTimeDisplay,
  getCurrentDateForFilename,
} from '@/lib/utils/date'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/contexts/toast-context'

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  product_sku: string
  quantity: number
  unit_price: number
  total_price: number
}

interface StatusHistory {
  id: string
  status: string
  previous_status: string
  notes: string
  location: string
  created_at: string
}

interface Order {
  id: string
  order_number: string
  user_id: string
  status: string
  payment_status: string
  payment_method: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  shipping_address: any
  billing_address: any
  customer_name: string
  customer_email: string
  customer_phone: string
  tracking_number: string
  carrier: string
  estimated_delivery: string
  notes: string
  order_items: OrderItem[]
  order_status_history?: StatusHistory[]
  created_at: string
  updated_at: string
}

export function AdminOrderDetailClient({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [generatingBill, setGeneratingBill] = useState(false)
  const [editingTracking, setEditingTracking] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier] = useState('')
  const [estimatedDelivery, setEstimatedDelivery] = useState('')
  const [notes, setNotes] = useState('')
  const toast = useToast()

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) throw new Error('Failed to fetch order')
      const data = await response.json()
      setOrder(data.order)
      // Initialize form fields
      if (data.order) {
        setTrackingNumber(data.order.tracking_number || '')
        setCarrier(data.order.carrier || '')
        setEstimatedDelivery(
          data.order.estimated_delivery
            ? new Date(data.order.estimated_delivery)
                .toISOString()
                .split('T')[0]
            : ''
        )
        setNotes(data.order.notes || '')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }, [orderId, toast])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdating(true)
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update order')

      toast.success('Order status updated')
      fetchOrder()
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  const handlePaymentStatusUpdate = async (newStatus: string) => {
    try {
      setUpdating(true)
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update payment status')

      toast.success('Payment status updated')
      fetchOrder()
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast.error('Failed to update payment status')
    } finally {
      setUpdating(false)
    }
  }

  const handleTrackingUpdate = async () => {
    try {
      setUpdating(true)
      const updateData: any = {
        tracking_number: trackingNumber,
      }
      if (carrier) {
        updateData.carrier = carrier
      }
      if (estimatedDelivery) {
        updateData.estimated_delivery = new Date(
          estimatedDelivery
        ).toISOString()
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) throw new Error('Failed to update tracking')

      toast.success('Tracking information updated')
      setEditingTracking(false)
      fetchOrder()
    } catch (error) {
      console.error('Error updating tracking:', error)
      toast.error('Failed to update tracking information')
    } finally {
      setUpdating(false)
    }
  }

  const handleNotesUpdate = async () => {
    try {
      setUpdating(true)
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) throw new Error('Failed to update notes')

      toast.success('Order notes updated')
      setEditingNotes(false)
      fetchOrder()
    } catch (error) {
      console.error('Error updating notes:', error)
      toast.error('Failed to update notes')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container py-8">
        <p className="text-center text-gray-600">Order not found</p>
      </div>
    )
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

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/orders')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          Order <span className="text-orange-600">{order.order_number}</span>
        </h1>
        <p className="text-gray-600 mt-2">
          Placed on{' '}
          {formatDateTimeDisplay(order.created_at, 'DD MMMM YYYY, HH:mm')}
        </p>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={async () => {
              if (generatingBill) return

              try {
                setGeneratingBill(true)
                const response = await fetch(
                  `/api/admin/export/orders/${orderId}/bill`
                )
                if (!response.ok) throw new Error('Failed to generate bill')

                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `invoice_${order.order_number}_${getCurrentDateForFilename()}.pdf`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast.success('Bill generated successfully')
              } catch (error) {
                console.error('Error generating bill:', error)
                toast.error('Failed to generate bill')
              } finally {
                setGeneratingBill(false)
              }
            }}
            disabled={generatingBill}
          >
            {generatingBill ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Bill (PDF)
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              Order Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">Current Status</Label>
              <div className="mt-2">
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Update Status</Label>
              <Select
                value={order.status}
                onValueChange={handleStatusUpdate}
                disabled={updating}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
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
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm text-gray-600">
                  Tracking Information
                </Label>
                {!editingTracking && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTracking(true)}
                  >
                    {order.tracking_number ? 'Edit' : 'Add'}
                  </Button>
                )}
              </div>
              {editingTracking ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Tracking Number</Label>
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Carrier</Label>
                    <Input
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      placeholder="e.g., FedEx, DHL, India Post"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Estimated Delivery</Label>
                    <Input
                      type="date"
                      value={estimatedDelivery}
                      onChange={(e) => setEstimatedDelivery(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleTrackingUpdate}
                      disabled={updating}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingTracking(false)
                        setTrackingNumber(order.tracking_number || '')
                        setCarrier(order.carrier || '')
                        setEstimatedDelivery(
                          order.estimated_delivery
                            ? new Date(order.estimated_delivery)
                                .toISOString()
                                .split('T')[0]
                            : ''
                        )
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {order.tracking_number ? (
                    <p className="mt-1 font-mono text-sm">
                      {order.tracking_number}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400">
                      No tracking number
                    </p>
                  )}
                  {order.carrier && (
                    <p className="text-xs text-gray-500">
                      Carrier: {order.carrier}
                    </p>
                  )}
                  {order.estimated_delivery && (
                    <p className="text-xs text-gray-500">
                      Est. Delivery:{' '}
                      {formatDateTimeDisplay(
                        order.estimated_delivery,
                        'DD MMM YYYY'
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-600" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">Payment Status</Label>
              <div className="mt-2">
                <Badge
                  className={
                    order.payment_status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {order.payment_status}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Payment Method</Label>
              <p className="mt-1 font-semibold">
                {order.payment_method?.toUpperCase() || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">
                Update Payment Status
              </Label>
              <Select
                value={order.payment_status}
                onValueChange={handlePaymentStatusUpdate}
                disabled={updating}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-600" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-sm text-gray-600">Name</Label>
              <p className="mt-1 font-semibold">
                {order.customer_name || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Email</Label>
              <p className="mt-1">{order.customer_email || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Phone</Label>
              <p className="mt-1">{order.customer_phone || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipping Address */}
      {order.shipping_address && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-semibold">{order.shipping_address.name}</p>
              <p>{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 && (
                <p>{order.shipping_address.address_line2}</p>
              )}
              <p>
                {order.shipping_address.city}, {order.shipping_address.state}{' '}
                {order.shipping_address.pincode}
              </p>
              <p>{order.shipping_address.country}</p>
              {order.shipping_address.phone && (
                <p>Phone: {order.shipping_address.phone}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.order_items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.product_name}
                  </TableCell>
                  <TableCell>{item.product_sku || 'N/A'}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>Rs. {item.unit_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    Rs. {item.total_price.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">
                Rs. {order.subtotal.toFixed(2)}
              </span>
            </div>
            {order.tax_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-semibold">
                  Rs. {order.tax_amount.toFixed(2)}
                </span>
              </div>
            )}
            {order.shipping_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold">
                  Rs. {order.shipping_amount.toFixed(2)}
                </span>
              </div>
            )}
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-Rs. {order.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-orange-600">
                Rs. {order.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm text-gray-600">Order Notes</Label>
              {!editingNotes && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingNotes(true)}
                >
                  {order.notes ? 'Edit' : 'Add Notes'}
                </Button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add order notes..."
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleNotesUpdate}
                    disabled={updating}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingNotes(false)
                      setNotes(order.notes || '')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm">{order.notes || 'No notes added'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Status History */}
      {order.order_status_history && order.order_status_history.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-orange-600" />
              Status History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.order_status_history
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .map((history, index) => (
                  <div
                    key={history.id}
                    className="flex items-start gap-4 pb-4 border-b last:border-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getStatusColor(history.status)}>
                          {history.status}
                        </Badge>
                        {history.previous_status && (
                          <>
                            <span className="text-gray-400">from</span>
                            <Badge variant="outline">
                              {history.previous_status}
                            </Badge>
                          </>
                        )}
                      </div>
                      {history.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          {history.notes}
                        </p>
                      )}
                      {history.location && (
                        <p className="text-xs text-gray-500 mt-1">
                          Location: {history.location}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDateTimeDisplay(
                          history.created_at,
                          'DD MMM YYYY, HH:mm'
                        )}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
