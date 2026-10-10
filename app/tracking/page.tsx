'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Package, ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { OrderStatusBadge, OrderTimeline } from '@/components/orders'

interface TrackedOrder {
  id: string
  order_number: string
  status: string
  created_at: string
  shipped_at?: string | null
  delivered_at?: string | null
  cancelled_at?: string | null
  tracking_number?: string | null
  carrier?: string | null
  estimated_delivery?: string | null
  order_status_history?: Array<{
    status: string
    notes?: string | null
    location?: string | null
    created_at: string
  }>
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Order Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

/** Timeline from the recorded status history (falls back to timestamps) */
function buildEvents(order: TrackedOrder) {
  const history = [...(order.order_status_history || [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  )
  if (history.length > 0) {
    return history.map((h) => ({
      status: h.status,
      label: STATUS_LABELS[h.status] || h.status,
      timestamp: h.created_at,
      description: h.notes || undefined,
      location: h.location || undefined,
    }))
  }
  return [
    {
      status: 'pending',
      label: STATUS_LABELS.pending,
      timestamp: order.created_at,
    },
    order.shipped_at && {
      status: 'shipped',
      label: STATUS_LABELS.shipped,
      timestamp: order.shipped_at,
    },
    order.delivered_at && {
      status: 'delivered',
      label: STATUS_LABELS.delivered,
      timestamp: order.delivered_at,
    },
    order.cancelled_at && {
      status: 'cancelled',
      label: STATUS_LABELS.cancelled,
      timestamp: order.cancelled_at,
    },
  ].filter(Boolean) as Array<{
    status: string
    label: string
    timestamp: string
  }>
}

function TrackingContent() {
  const { status: sessionStatus } = useSession()
  const searchParams = useSearchParams()
  const [reference, setReference] = useState(searchParams.get('orderId') || '')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<TrackedOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const token = searchParams.get('token')

  const track = useCallback(
    async (ref: string, emailValue: string) => {
      const value = ref.trim()
      if (!value) return
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams()
        if (token) params.set('token', token)
        if (emailValue.trim()) params.set('email', emailValue.trim())
        const response = await fetch(
          `/api/orders/${encodeURIComponent(value)}?${params.toString()}`,
          { cache: 'no-store' }
        )
        if (response.ok) {
          setOrder((await response.json()).order)
        } else {
          setOrder(null)
          setError(
            sessionStatus === 'authenticated'
              ? 'We could not find that order on your account.'
              : 'No order matches that order number and email.'
          )
        }
      } catch {
        setError('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [token, sessionStatus]
  )

  // Arriving from the order confirmation (?orderId=...&token=...)
  useEffect(() => {
    const orderId = searchParams.get('orderId')
    if (orderId && sessionStatus !== 'loading') track(orderId, '')
  }, [searchParams, sessionStatus, track])

  const needsEmail = sessionStatus !== 'authenticated' && !token

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <Link
          href={sessionStatus === 'authenticated' ? '/profile/orders' : '/shop'}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {sessionStatus === 'authenticated'
            ? 'Back to My Orders'
            : 'Continue Shopping'}
        </Link>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Track Your Order
            </h1>
            <p className="text-gray-600">
              Enter your order number
              {needsEmail ? ' and the email used at checkout' : ''} to see its
              status.
            </p>
          </div>

          {!order && (
            <Card className="border-gray-200 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Enter Order Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    track(reference, email)
                  }}
                >
                  <div>
                    <Label htmlFor="order-ref">Order number</Label>
                    <Input
                      id="order-ref"
                      placeholder="e.g. ORD-20261010-000123"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      required
                    />
                  </div>
                  {needsEmail && (
                    <div>
                      <Label htmlFor="order-email">Email</Label>
                      <Input
                        id="order-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={loading || !reference.trim()}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Package className="h-4 w-4 mr-2" />
                    )}
                    Track Order
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {order && (
            <>
              <Card className="border-gray-200 shadow-xl bg-white">
                <CardContent className="p-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order</p>
                    <p className="text-xl font-bold text-gray-900">
                      #{order.order_number}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-xl bg-white">
                <CardContent className="p-6">
                  <OrderTimeline
                    currentStatus={order.status}
                    events={buildEvents(order)}
                    trackingNumber={order.tracking_number || undefined}
                    estimatedDelivery={order.estimated_delivery || undefined}
                  />
                  {order.carrier && (
                    <p className="mt-4 text-sm text-gray-600">
                      Carrier:{' '}
                      <span className="font-semibold">{order.carrier}</span>
                    </p>
                  )}
                </CardContent>
              </Card>

              <Button
                variant="outline"
                onClick={() => {
                  setOrder(null)
                  setReference('')
                }}
              >
                Track another order
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  )
}
