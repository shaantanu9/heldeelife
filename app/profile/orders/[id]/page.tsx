'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Package,
  ArrowLeft,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  CreditCard,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface OrderItem {
  id: string
  product_id: string
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
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  order_items: OrderItem[]
  created_at: string
  shipped_at?: string
  delivered_at?: string
  tracking_number?: string
  shipping_address: any
  billing_address?: any
  payment_method: string
  notes?: string
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
]

export default function OrderTrackingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [productSlugs, setProductSlugs] = useState<Record<string, string>>({})

  const fetchOrder = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) throw new Error('Failed to fetch order')
      const data = await response.json()
      setOrder(data.order)

      // Fetch product slugs for order items
      if (data.order?.order_items?.length > 0) {
        const slugs: Record<string, string> = {}
        await Promise.all(
          data.order.order_items.map(async (item: OrderItem) => {
            try {
              const productResponse = await fetch(
                `/api/products/${item.product_id}`
              )
              if (productResponse.ok) {
                const productData = await productResponse.json()
                if (productData.product?.slug) {
                  slugs[item.product_id] = productData.product.slug
                }
              }
            } catch (error) {
              console.error(`Error fetching product ${item.product_id}:`, error)
            }
          })
        )
        setProductSlugs(slugs)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchOrder()
  }, [session, orderId, router, fetchOrder])

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

  const getCurrentStepIndex = () => {
    if (!order) return 0
    return statusSteps.findIndex((step) => step.key === order.status)
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

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-24">
        <div className="container px-4">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <XCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Order Not Found
              </h2>
              <p className="text-gray-600 mb-6">
                The order you&apos;re looking for doesn&apos;t exist.
              </p>
              <Button
                asChild
                className="rounded-lg bg-orange-600 hover:bg-orange-700"
              >
                <Link href="/profile/orders">Back to Orders</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const currentStepIndex = getCurrentStepIndex()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <Link
          href="/profile/orders"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Order Header */}
          <Card className="border-gray-200 shadow-xl bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-gray-900 mb-2">
                    Order #{order.order_number}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Placed on{' '}
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <Badge
                  className={`px-4 py-2 text-sm font-semibold ${getStatusColor(order.status)}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Order Tracking Timeline */}
          <Card className="border-gray-200 shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-6">
                  {statusSteps.map((step, index) => {
                    const StepIcon = step.icon
                    const isCompleted = index <= currentStepIndex
                    const isCurrent = index === currentStepIndex

                    return (
                      <div
                        key={step.key}
                        className="relative flex items-start gap-4"
                      >
                        <div
                          className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                            isCompleted
                              ? 'bg-orange-600 border-orange-600 text-white'
                              : 'bg-white border-gray-300 text-gray-400'
                          }`}
                        >
                          <StepIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 pt-2">
                          <p
                            className={`font-semibold ${
                              isCompleted ? 'text-gray-900' : 'text-gray-400'
                            }`}
                          >
                            {step.label}
                          </p>
                          {isCurrent &&
                            order.status === 'shipped' &&
                            order.tracking_number && (
                              <p className="text-sm text-gray-600 mt-1">
                                Tracking: {order.tracking_number}
                              </p>
                            )}
                          {isCurrent &&
                            order.status === 'delivered' &&
                            order.delivered_at && (
                              <p className="text-sm text-gray-600 mt-1">
                                Delivered on{' '}
                                {new Date(
                                  order.delivered_at
                                ).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="border-gray-200 shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="w-20 h-20 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-8 w-8 text-orange-600" />
                    </div>
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
            </CardContent>
          </Card>

          {/* Shipping & Payment Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-gray-200 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.shipping_address && (
                  <div className="text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-900">
                      {order.shipping_address.name}
                    </p>
                    <p>{order.shipping_address.address}</p>
                    {order.shipping_address.addressLine2 && (
                      <p>{order.shipping_address.addressLine2}</p>
                    )}
                    <p>
                      {order.shipping_address.city},{' '}
                      {order.shipping_address.state}{' '}
                      {order.shipping_address.pincode}
                    </p>
                    {order.shipping_address.phone && (
                      <p>Phone: {order.shipping_address.phone}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-semibold text-gray-900 capitalize">
                      {order.payment_method === 'cod'
                        ? 'Cash on Delivery'
                        : 'Online Payment'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <Badge
                      className={
                        order.payment_status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {order.payment_status.charAt(0).toUpperCase() +
                        order.payment_status.slice(1)}
                    </Badge>
                  </div>
                  {order.tracking_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking Number:</span>
                      <span className="font-semibold text-gray-900">
                        {order.tracking_number}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <Card className="border-gray-200 shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>Rs. {Number(order.subtotal).toFixed(2)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>
                      - Rs. {Number(order.discount_amount).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>Rs. {Number(order.tax_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {order.shipping_amount > 0
                      ? `Rs. ${Number(order.shipping_amount).toFixed(2)}`
                      : 'Free'}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-orange-600">
                    Rs. {Number(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {order.status === 'pending' && (
            <Card className="border-gray-200 shadow-xl bg-white">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={async () => {
                      if (
                        confirm('Are you sure you want to cancel this order?')
                      ) {
                        try {
                          const response = await fetch(
                            `/api/orders/${order.id}`,
                            {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                status: 'cancelled',
                                cancelled_reason: 'Cancelled by customer',
                              }),
                            }
                          )
                          if (response.ok) {
                            router.push('/profile/orders')
                          }
                        } catch (error) {
                          console.error('Error cancelling order:', error)
                        }
                      }
                    }}
                  >
                    Cancel Order
                  </Button>
                  <Button
                    asChild
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    <Link
                      href={`/products/${productSlugs[order.order_items[0]?.product_id] || order.order_items[0]?.product_id}`}
                    >
                      Buy Again
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
