'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
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
  User,
  FileText,
  RefreshCw,
} from 'lucide-react'
import {
  formatDateTimeDisplay,
} from '@/lib/utils/date'
import { useToast } from '@/contexts/toast-context'

interface Return {
  id: string
  order_id: string
  order_number?: string
  order_item_id?: string
  user_id: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  reason: string
  description: string
  status: string
  return_type: string
  exchange_product_id?: string
  refund_amount: number
  tracking_number?: string
  picked_up_at?: string
  received_at?: string
  processed_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export function AdminReturnDetailClient({ returnId }: { returnId: string }) {
  const router = useRouter()
  const [returnItem, setReturnItem] = useState<Return | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const toast = useToast()

  const fetchReturn = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/returns/${returnId}`)
      if (!response.ok) throw new Error('Failed to fetch return')
      const data = await response.json()
      setReturnItem(data.return)
      setTrackingNumber(data.return?.tracking_number || '')
    } catch (error) {
      console.error('Error fetching return:', error)
      toast.error('Failed to load return details')
    } finally {
      setLoading(false)
    }
  }, [returnId, toast])

  useEffect(() => {
    fetchReturn()
  }, [fetchReturn])

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdating(true)
      const updateData: any = { status: newStatus }
      
      if (newStatus === 'picked_up' && trackingNumber) {
        updateData.tracking_number = trackingNumber
        updateData.picked_up_at = new Date().toISOString()
      }
      if (newStatus === 'received') {
        updateData.received_at = new Date().toISOString()
      }
      if (newStatus === 'processed' || newStatus === 'refunded') {
        updateData.processed_at = new Date().toISOString()
      }

      const response = await fetch(`/api/returns/${returnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) throw new Error('Failed to update return')

      toast.success('Return status updated')
      fetchReturn()
    } catch (error) {
      console.error('Error updating return:', error)
      toast.error('Failed to update return status')
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

  if (!returnItem) {
    return (
      <div className="container py-8">
        <p className="text-center text-gray-600">Return not found</p>
      </div>
    )
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
        return 'bg-purple-100 text-purple-800'
      case 'received':
        return 'bg-indigo-100 text-indigo-800'
      case 'processed':
        return 'bg-green-100 text-green-800'
      case 'refunded':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/returns')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Returns
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          Return <span className="text-orange-600">Details</span>
        </h1>
        <p className="text-gray-600 mt-2">
          Created on{' '}
          {formatDateTimeDisplay(returnItem.created_at, 'DD MMMM YYYY, HH:mm')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Return Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              Return Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">Current Status</Label>
              <div className="mt-2">
                <Badge className={getStatusColor(returnItem.status)}>
                  {returnItem.status}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Update Status</Label>
              <Select
                value={returnItem.status}
                onValueChange={handleStatusUpdate}
                disabled={updating}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {returnItem.tracking_number && (
              <div>
                <Label className="text-sm text-gray-600">Tracking Number</Label>
                <p className="mt-1 font-mono text-sm">
                  {returnItem.tracking_number}
                </p>
              </div>
            )}
            {returnItem.status === 'approved' && (
              <div>
                <Label className="text-sm text-gray-600">Tracking Number</Label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="mt-1"
                />
              </div>
            )}
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
                {returnItem.customer_name || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Email</Label>
              <p className="mt-1">{returnItem.customer_email || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Phone</Label>
              <p className="mt-1">{returnItem.customer_phone || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Return Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              Return Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-sm text-gray-600">Return Type</Label>
              <p className="mt-1">
                <Badge variant="outline">
                  {returnItem.return_type || 'refund'}
                </Badge>
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Reason</Label>
              <p className="mt-1">{returnItem.reason}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Refund Amount</Label>
              <p className="mt-1 font-semibold text-lg">
                ₹{Number(returnItem.refund_amount || 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{returnItem.description}</p>
        </CardContent>
      </Card>

      {/* Rejection Reason */}
      {returnItem.rejection_reason && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rejection Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{returnItem.rejection_reason}</p>
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span>
              {formatDateTimeDisplay(returnItem.created_at, 'DD MMM YYYY, HH:mm')}
            </span>
          </div>
          {returnItem.picked_up_at && (
            <div className="flex justify-between">
              <span className="text-gray-600">Picked Up:</span>
              <span>
                {formatDateTimeDisplay(returnItem.picked_up_at, 'DD MMM YYYY, HH:mm')}
              </span>
            </div>
          )}
          {returnItem.received_at && (
            <div className="flex justify-between">
              <span className="text-gray-600">Received:</span>
              <span>
                {formatDateTimeDisplay(returnItem.received_at, 'DD MMM YYYY, HH:mm')}
              </span>
            </div>
          )}
          {returnItem.processed_at && (
            <div className="flex justify-between">
              <span className="text-gray-600">Processed:</span>
              <span>
                {formatDateTimeDisplay(returnItem.processed_at, 'DD MMM YYYY, HH:mm')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}









