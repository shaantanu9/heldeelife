'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTracking } from '@/contexts/tracking-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Package, ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { OrderStatusBadge, OrderTimeline } from '@/components/orders'

export default function TrackingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { trackingStatus, isLoading, trackOrder, clearTracking } = useTracking()
  const [orderIdInput, setOrderIdInput] = useState('')
  const [orderNumberInput, setOrderNumberInput] = useState('')

  useEffect(() => {
    const orderId = searchParams.get('orderId')
    if (orderId) {
      trackOrder(orderId)
      setOrderIdInput(orderId)
    }
  }, [searchParams, trackOrder])

  const handleTrack = () => {
    if (orderIdInput.trim()) {
      trackOrder(orderIdInput.trim())
    } else if (orderNumberInput.trim()) {
      // If order number is provided, we'd need to fetch order ID first
      // For now, treat it as order ID
      trackOrder(orderNumberInput.trim())
    }
  }

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
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Track Your Order
            </h1>
            <p className="text-gray-600">
              Enter your order number or order ID to track your shipment
            </p>
          </div>

          {/* Track Order Form */}
          {!trackingStatus && (
            <Card className="border-gray-200 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Enter Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Order ID or Order Number
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter order ID or order number"
                    value={orderIdInput || orderNumberInput}
                    onChange={(e) => {
                      setOrderIdInput(e.target.value)
                      setOrderNumberInput(e.target.value)
                    }}
                    className="rounded-lg"
                  />
                </div>
                <Button
                  onClick={handleTrack}
                  className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={!orderIdInput.trim() && !orderNumberInput.trim()}
                >
                  Track Order
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <Card className="border-gray-200 shadow-xl bg-white">
              <CardContent className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading order details...</p>
              </CardContent>
            </Card>
          )}

          {/* Tracking Status */}
          {trackingStatus && !isLoading && (
            <>
              {/* Order Header */}
              <Card className="border-gray-200 shadow-xl bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-2xl text-gray-900">
                          Order #{trackingStatus.orderNumber}
                        </CardTitle>
                        <OrderStatusBadge
                          status={trackingStatus.currentStatus}
                          size="lg"
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        Track your order status in real-time
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Tracking Timeline */}
              <Card className="border-gray-200 shadow-xl bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">
                    Order Status Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderTimeline
                    currentStatus={trackingStatus.currentStatus}
                    events={trackingStatus.events}
                    trackingNumber={trackingStatus.trackingNumber}
                    estimatedDelivery={trackingStatus.estimatedDelivery}
                  />
                </CardContent>
              </Card>

              {/* Tracking Details */}
              {(trackingStatus.trackingNumber ||
                trackingStatus.carrier ||
                trackingStatus.estimatedDelivery) && (
                <Card className="border-gray-200 shadow-xl bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-900">
                      Shipping Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {trackingStatus.trackingNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tracking Number:</span>
                        <span className="font-mono font-semibold text-gray-900">
                          {trackingStatus.trackingNumber}
                        </span>
                      </div>
                    )}
                    {trackingStatus.carrier && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Carrier:</span>
                        <span className="font-semibold text-gray-900">
                          {trackingStatus.carrier}
                        </span>
                      </div>
                    )}
                    {trackingStatus.estimatedDelivery && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          Estimated Delivery:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {new Date(
                            trackingStatus.estimatedDelivery
                          ).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card className="border-gray-200 shadow-xl bg-white">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        clearTracking()
                        setOrderIdInput('')
                        setOrderNumberInput('')
                      }}
                    >
                      Track Another Order
                    </Button>
                    <Button
                      asChild
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      <Link href={`/orders/${trackingStatus.orderId}`}>
                        View Order Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* No Results */}
          {!trackingStatus && !isLoading && orderIdInput && (
            <Card className="border-gray-200 shadow-xl bg-white">
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Order Not Found
                </h2>
                <p className="text-gray-600 mb-6">
                  We couldn&apos;t find an order with that ID. Please check and
                  try again.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOrderIdInput('')
                    setOrderNumberInput('')
                  }}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
