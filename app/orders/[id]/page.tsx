'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useOrderContext } from '@/contexts/order-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, Truck, XCircle, Download } from 'lucide-react'
import Link from 'next/link'
import {
  OrderStatusBadge,
  OrderTimeline,
  OrderItemCard,
  OrderSummary,
  ShippingAddress,
  PaymentInfo,
} from '@/components/orders'
import {
  OrderSuccessCelebration,
  OrderSocialProof,
  OrderNextSteps,
  OrderTrustSignals,
  OrderUpsell,
  OrderReviewPrompt,
  OrderShare,
} from '@/components/conversion/order-confirmation-enhancements'
import { PostPurchaseJourney } from '@/components/conversion/post-purchase-journey'

export default function OrderDetailsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const { currentOrder, isLoadingOrder, setCurrentOrderId, cancelOrder } =
    useOrderContext()

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    setCurrentOrderId(orderId)
  }, [session, orderId, router, setCurrentOrderId])

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return
    }

    try {
      await cancelOrder(orderId, 'Cancelled by customer')
      router.push('/orders')
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('Failed to cancel order. Please try again.')
    }
  }

  if (!session) {
    return null
  }

  if (isLoadingOrder) {
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

  if (!currentOrder) {
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
                <Link href="/orders">Back to Orders</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const order = currentOrder as any

  const handleDownloadInvoice = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${order.order_number || orderId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to download invoice. Please try again.')
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
      alert('Failed to download invoice. Please try again.')
    }
  }

  // Build timeline events from order
  const timelineEvents = [
    {
      status: 'pending',
      timestamp: currentOrder.created_at,
      description: 'Order placed successfully',
    },
    ...(order.shipped_at
      ? [
          {
            status: 'shipped',
            timestamp: order.shipped_at,
            description: order.tracking_number
              ? `Shipped with tracking: ${order.tracking_number}`
              : 'Order has been shipped',
          },
        ]
      : []),
    ...(order.delivered_at
      ? [
          {
            status: 'delivered',
            timestamp: order.delivered_at,
            description: 'Order delivered successfully',
          },
        ]
      : []),
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Order Success Celebration - Only show for new orders */}
          {currentOrder.status === 'pending' && (
            <OrderSuccessCelebration
              orderNumber={
                order.order_number || order.id.slice(0, 8).toUpperCase()
              }
            />
          )}

          {/* Social Proof */}
          <OrderSocialProof />

          {/* Order Header */}
          <Card className="border-gray-200 shadow-xl bg-white">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <CardTitle className="text-2xl text-gray-900">
                      Order Details
                    </CardTitle>
                    <OrderStatusBadge status={currentOrder.status} size="lg" />
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-3">
                    <p className="text-xs text-gray-600 mb-1">Order Number</p>
                    <p className="text-2xl font-bold text-orange-700">
                      #
                      {order.order_number || order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Placed on{' '}
                    {new Date(currentOrder.created_at).toLocaleDateString(
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
              </div>
            </CardHeader>
          </Card>

          {/* Enhanced Post-Purchase Journey */}
          <PostPurchaseJourney
            orderId={orderId}
            orderNumber={
              order.order_number || order.id.slice(0, 8).toUpperCase()
            }
            orderStatus={currentOrder.status}
            estimatedDelivery={order.estimated_delivery}
          />

          {/* Order Tracking Timeline (Fallback) */}
          <Card className="border-gray-200 shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">
                Order Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline
                currentStatus={currentOrder.status}
                events={timelineEvents as any}
                trackingNumber={order.tracking_number}
                estimatedDelivery={order.estimated_delivery}
              />
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="border-gray-200 shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">
                Order Items ({currentOrder.order_items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentOrder.order_items?.map((item) => (
                  <OrderItemCard key={item.id} item={item} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping & Payment Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <ShippingAddress
              address={currentOrder.shipping_address}
              title="Shipping Address"
            />
            <PaymentInfo
              paymentMethod={currentOrder.payment_method}
              paymentStatus={currentOrder.payment_status}
              paymentTransactionId={order.payment_transaction_id}
              trackingNumber={order.tracking_number}
              carrier={order.carrier}
            />
          </div>

          {/* Order Summary */}
          <OrderSummary
            subtotal={currentOrder.subtotal}
            taxAmount={currentOrder.tax_amount}
            shippingAmount={currentOrder.shipping_amount}
            discountAmount={currentOrder.discount_amount}
            totalAmount={currentOrder.total_amount}
            currency={order.currency || 'INR'}
          />

          {/* Next Steps - Reduces anxiety */}
          <OrderNextSteps />

          {/* Trust Signals */}
          <OrderTrustSignals />

          {/* Review Prompt - Generate social proof */}
          {currentOrder.order_items && currentOrder.order_items.length > 0 && (
            <OrderReviewPrompt
              orderId={orderId}
              productId={currentOrder.order_items[0].product_id || ''}
              productName={currentOrder.order_items[0].product_name || ''}
            />
          )}

          {/* Share Order */}
          <OrderShare
            orderNumber={
              order.order_number || order.id.slice(0, 8).toUpperCase()
            }
          />

          {/* Actions */}
          <Card className="border-gray-200 shadow-xl bg-white">
            <CardContent className="p-6">
              <div className="flex gap-4">
                {currentOrder.status === 'pending' && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancelOrder}
                  >
                    Cancel Order
                  </Button>
                )}
                <Button asChild variant="outline" className="flex-1">
                  <Link href={`/tracking?orderId=${orderId}`}>
                    <Truck className="h-4 w-4 mr-2" />
                    Track Order
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownloadInvoice}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
