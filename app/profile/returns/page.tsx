'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  ArrowLeft,
  Package,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { OrderStatusBadge } from '@/components/orders'

interface ReturnRequest {
  id: string
  order_id: string
  order_item_id?: string
  reason: string
  description: string
  status: string
  return_type?: string
  refund_amount?: number
  tracking_number?: string
  rejection_reason?: string
  created_at: string
  orders: {
    id: string
    order_number: string
    total_amount: number
  }
  order_items?: {
    id: string
    product_name: string
    product_image?: string
    quantity: number
  }
}

export default function ReturnsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchReturns()
  }, [session, router])

  const fetchReturns = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/returns')
      if (response.ok) {
        const data = await response.json()
        setReturns(data.returns || [])
      } else {
        toast.error('Failed to load returns')
      }
    } catch (error) {
      console.error('Error fetching returns:', error)
      toast.error('Failed to load returns')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'picked_up':
        return 'bg-indigo-100 text-indigo-800'
      case 'received':
        return 'bg-purple-100 text-purple-800'
      case 'processed':
        return 'bg-green-100 text-green-800'
      case 'refunded':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatReason = (reason: string) => {
    return reason
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (!session) {
    return null
  }

  if (isLoading) {
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

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Returns & Refunds
            </h1>
            <p className="text-gray-600">
              Track your return requests and refund status
            </p>
          </div>
        </div>

        {returns.length === 0 ? (
          <Card className="border border-gray-200 shadow-xl bg-white">
            <CardContent className="p-12 text-center">
              <RefreshCw className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Returns Found
              </h2>
              <p className="text-gray-600 mb-6">
                You haven&apos;t requested any returns yet
              </p>
              <Button
                asChild
                className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Link href="/orders">View Orders</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {returns.map((returnRequest) => (
              <Card
                key={returnRequest.id}
                className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <CardTitle className="text-gray-900">
                          Return Request
                        </CardTitle>
                        <Badge className={getStatusColor(returnRequest.status)}>
                          {returnRequest.status
                            .charAt(0)
                            .toUpperCase() + returnRequest.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Order #{returnRequest.orders.order_number} •{' '}
                        {new Date(returnRequest.created_at).toLocaleDateString(
                          'en-IN',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        Reason
                      </p>
                      <p className="text-gray-600">
                        {formatReason(returnRequest.reason)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        Description
                      </p>
                      <p className="text-gray-600">{returnRequest.description}</p>
                    </div>
                    {returnRequest.order_items && (
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-2">
                          Item(s) to Return
                        </p>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="font-semibold text-gray-900">
                            {returnRequest.order_items.product_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Quantity: {returnRequest.order_items.quantity}
                          </p>
                        </div>
                      </div>
                    )}
                    {returnRequest.refund_amount && (
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <span className="text-sm font-semibold text-gray-900">
                          Refund Amount:
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          Rs. {Number(returnRequest.refund_amount).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {returnRequest.tracking_number && (
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          Tracking Number
                        </p>
                        <p className="text-gray-600 font-mono">
                          {returnRequest.tracking_number}
                        </p>
                      </div>
                    )}
                    {returnRequest.rejection_reason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm font-semibold text-red-900 mb-1">
                          Rejection Reason
                        </p>
                        <p className="text-sm text-red-700">
                          {returnRequest.rejection_reason}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <Button asChild variant="outline" className="flex-1">
                        <Link href={`/orders/${returnRequest.order_id}`}>
                          View Order
                        </Link>
                      </Button>
                      {returnRequest.status === 'pending' && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={async () => {
                            if (
                              !confirm(
                                'Are you sure you want to cancel this return request?'
                              )
                            ) {
                              return
                            }

                            try {
                              const response = await fetch(
                                `/api/returns/${returnRequest.id}`,
                                {
                                  method: 'DELETE',
                                }
                              )

                              if (response.ok) {
                                toast.success('Return request cancelled')
                                fetchReturns()
                              } else {
                                toast.error('Failed to cancel return')
                              }
                            } catch (error) {
                              console.error('Error cancelling return:', error)
                              toast.error('Failed to cancel return')
                            }
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel Request
                        </Button>
                      )}
                    </div>
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










