'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Package,
  Truck,
  Download,
  Share2,
  Star,
  ShoppingBag,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import {
  OrderSuccessCelebration,
  OrderSocialProof,
  OrderNextSteps,
  OrderTrustSignals,
  OrderUpsell,
  OrderReviewPrompt,
  OrderShare,
} from '@/components/conversion/order-confirmation-enhancements'

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  total_amount: number
  created_at: string
  order_items?: Array<{
    id: string
    product_name: string
    quantity: number
    product_image?: string
    product_id?: string
  }>
}

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!orderId) {
      router.push('/orders')
      return
    }

    fetchOrder()
  }, [orderId, session, router])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else {
        router.push('/orders')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = async () => {
    if (!orderId) return
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${order?.order_number || orderId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
    }
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
              <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Order Not Found
              </h2>
              <p className="text-gray-600 mb-6">
                We couldn&apos;t find your order. Please check your order history.
              </p>
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
                <Link href="/orders">View Orders</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Success Celebration */}
          <OrderSuccessCelebration
            orderNumber={order.order_number || order.id.slice(0, 8).toUpperCase()}
          />

          {/* Social Proof */}
          <OrderSocialProof />

          {/* Order Summary Card */}
          <Card className="border border-gray-200 shadow-xl bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order Number</p>
                  <p className="text-2xl font-bold text-orange-600">
                    #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    Rs. {Number(order.total_amount).toFixed(2)}
                  </p>
                  {order.payment_status === 'paid' && (
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Paid
                    </Badge>
                  )}
                </div>
              </div>

              {order.order_items && order.order_items.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <p className="text-sm font-semibold text-gray-900 mb-4">
                    Order Items ({order.order_items.length})
                  </p>
                  <div className="space-y-3">
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-16 h-16 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {item.product_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <OrderNextSteps />

          {/* Trust Signals */}
          <OrderTrustSignals />

          {/* Review Prompt */}
          {order.order_items && order.order_items.length > 0 && (
            <OrderReviewPrompt
              orderId={order.id}
              productId={order.order_items[0].product_id || ''}
              productName={order.order_items[0].product_name || ''}
            />
          )}

          {/* Share Order */}
          <OrderShare
            orderNumber={order.order_number || order.id.slice(0, 8).toUpperCase()}
          />

          {/* Action Buttons */}
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              asChild
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Link href={`/orders/${order.id}`}>
                <Package className="h-4 w-4 mr-2" />
                View Order Details
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <Link href={`/tracking?orderId=${order.id}`}>
                <Truck className="h-4 w-4 mr-2" />
                Track Order
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDownloadInvoice}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Invoice
            </Button>
          </div>

          {/* Continue Shopping */}
          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-6 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Continue Shopping
              </h3>
              <p className="text-gray-600 mb-4">
                Discover more authentic Ayurvedic products
              </p>
              <Button
                asChild
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Link href="/shop">
                  Browse Products
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}









