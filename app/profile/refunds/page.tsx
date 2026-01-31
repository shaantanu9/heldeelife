'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  RefreshCw,
  Package,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'

interface RefundRequest {
  id: string
  order_id: string
  order_number: string
  reason: string
  description: string
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  amount: number
  created_at: string
  processed_at?: string
  rejection_reason?: string
}

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
  order_items: Array<{
    id: string
    product_name: string
    quantity: number
    unit_price: number
  }>
}

export default function RefundsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<string>('')
  const [refundData, setRefundData] = useState({
    reason: '',
    description: '',
  })

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchData()
  }, [session, router])

  const fetchData = async () => {
    try {
      // Fetch user orders (only delivered orders can be refunded)
      const ordersRes = await fetch('/api/orders')
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        const eligibleOrders =
          ordersData.orders?.filter((o: Order) => o.status === 'delivered') ||
          []
        setOrders(eligibleOrders)
      }

      // Fetch refund requests
      const refundsRes = await fetch('/api/refunds')
      if (refundsRes.ok) {
        const refundsData = await refundsRes.json()
        setRefunds(refundsData.refunds || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRefund = async () => {
    if (!selectedOrder || !refundData.reason || !refundData.description) {
      alert('Please fill in all fields')
      return
    }

    try {
      const response = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder,
          reason: refundData.reason,
          description: refundData.description,
        }),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setRefundData({ reason: '', description: '' })
        setSelectedOrder('')
        fetchData()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create refund request')
      }
    } catch (error) {
      console.error('Error creating refund:', error)
      alert('Failed to create refund request')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'processed':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'approved':
        return <CheckCircle2 className="h-4 w-4" />
      case 'processed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
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

        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              Refunds & Returns
            </h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Request Refund
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Request Refund</DialogTitle>
                  <DialogDescription>
                    Select an order and provide details for your refund request
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="order">Select Order *</Label>
                    <Select
                      value={selectedOrder}
                      onValueChange={setSelectedOrder}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an order" />
                      </SelectTrigger>
                      <SelectContent>
                        {orders.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            Order #{order.order_number} - Rs.{' '}
                            {Number(order.total_amount).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason for Refund *</Label>
                    <Select
                      value={refundData.reason}
                      onValueChange={(value) =>
                        setRefundData({ ...refundData, reason: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="defective">
                          Product Defective
                        </SelectItem>
                        <SelectItem value="wrong_item">
                          Wrong Item Received
                        </SelectItem>
                        <SelectItem value="damaged">
                          Item Damaged in Transit
                        </SelectItem>
                        <SelectItem value="not_as_described">
                          Not as Described
                        </SelectItem>
                        <SelectItem value="changed_mind">
                          Changed My Mind
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide details about your refund request..."
                      value={refundData.description}
                      onChange={(e) =>
                        setRefundData({
                          ...refundData,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateRefund}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Submit Request
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {refunds.length === 0 ? (
            <Card className="border-gray-200 shadow-xl bg-white">
              <CardContent className="p-12 text-center">
                <RefreshCw className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  No Refund Requests
                </h2>
                <p className="text-gray-600 mb-6">
                  You haven&apos;t requested any refunds yet. Click
                  &quot;Request Refund&quot; to start.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {refunds.map((refund) => (
                <Card
                  key={refund.id}
                  className="border-gray-200 shadow-md bg-white"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-gray-900">
                          Refund Request #{refund.id.slice(0, 8)}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Order #{refund.order_number} •{' '}
                          {new Date(refund.created_at).toLocaleDateString(
                            'en-IN',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )}
                        </p>
                      </div>
                      <Badge
                        className={`${getStatusColor(refund.status)} flex items-center gap-1`}
                      >
                        {getStatusIcon(refund.status)}
                        {refund.status.charAt(0).toUpperCase() +
                          refund.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Reason</p>
                          <p className="font-semibold text-gray-900 capitalize">
                            {refund.reason.replace('_', ' ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="font-semibold text-orange-600">
                            Rs. {Number(refund.amount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Description
                        </p>
                        <p className="text-gray-900">{refund.description}</p>
                      </div>
                      {refund.rejection_reason && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-semibold text-red-900 mb-1">
                            Rejection Reason:
                          </p>
                          <p className="text-sm text-red-700">
                            {refund.rejection_reason}
                          </p>
                        </div>
                      )}
                      {refund.processed_at && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-semibold text-green-900">
                            Refund processed on{' '}
                            {new Date(refund.processed_at).toLocaleDateString(
                              'en-IN',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )}
                          </p>
                        </div>
                      )}
                      <div className="pt-4 border-t">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/profile/orders/${refund.order_id}`}>
                            View Order
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}









