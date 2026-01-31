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
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Search,
  X,
  Package,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { formatDateDisplay } from '@/lib/utils/date'
import { useToast } from '@/contexts/toast-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface Return {
  id: string
  order_id: string
  order_number?: string
  order_item_id?: string
  user_id: string
  customer_name?: string
  customer_email?: string
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

export function AdminReturnsClient() {
  const [returns, setReturns] = useState<Return[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null)
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const toast = useToast()

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const queryString = params.toString()
      const url = `/api/returns${queryString ? `?${queryString}` : ''}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch returns')
      const data = await response.json()
      setReturns(data.returns || [])
    } catch (error) {
      console.error('Error fetching returns:', error)
      toast.error('Failed to load returns')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery, toast])

  useEffect(() => {
    fetchReturns()
  }, [fetchReturns])

  const handleStatusUpdate = async (returnId: string, newStatus: string) => {
    if (updating === returnId) return

    try {
      setUpdating(returnId)
      const response = await fetch(`/api/returns/${returnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update return')

      toast.success('Return status updated')
      fetchReturns()
    } catch (error) {
      console.error('Error updating return:', error)
      toast.error('Failed to update return status')
    } finally {
      setUpdating(null)
    }
  }

  const handleReject = async () => {
    if (!selectedReturn || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      setUpdating(selectedReturn.id)
      const response = await fetch(`/api/returns/${selectedReturn.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: rejectionReason,
        }),
      })

      if (!response.ok) throw new Error('Failed to reject return')

      toast.success('Return rejected')
      setRejectionDialogOpen(false)
      setRejectionReason('')
      setSelectedReturn(null)
      fetchReturns()
    } catch (error) {
      console.error('Error rejecting return:', error)
      toast.error('Failed to reject return')
    } finally {
      setUpdating(null)
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

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      defective: 'Defective Product',
      wrong_item: 'Wrong Item',
      damaged: 'Damaged',
      not_as_described: 'Not as Described',
      size_issue: 'Size Issue',
      changed_mind: 'Changed Mind',
      other: 'Other',
    }
    return labels[reason] || reason
  }

  if (loading && returns.length === 0) {
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
          Returns & <span className="text-orange-600">Refunds</span>
        </h1>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by order number, customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Returns ({returns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {returns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No returns found matching your filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((returnItem) => (
                  <TableRow key={returnItem.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/orders/${returnItem.order_id}`}
                        className="text-orange-600 hover:underline"
                      >
                        {returnItem.order_number || returnItem.order_id.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {returnItem.customer_name || 'N/A'}
                        </div>
                        {returnItem.customer_email && (
                          <div className="text-xs text-gray-500">
                            {returnItem.customer_email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getReasonLabel(returnItem.reason)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {returnItem.return_type || 'refund'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      ₹{Number(returnItem.refund_amount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(returnItem.status)}>
                        {returnItem.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateDisplay(returnItem.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/admin/returns/${returnItem.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        {returnItem.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleStatusUpdate(returnItem.id, 'approved')
                              }
                              disabled={updating === returnItem.id}
                            >
                              {updating === returnItem.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedReturn(returnItem)
                                setRejectionDialogOpen(true)
                              }}
                              disabled={updating === returnItem.id}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Return Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this return request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection_reason">Rejection Reason</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectionDialogOpen(false)
                setRejectionReason('')
                setSelectedReturn(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleReject} disabled={!rejectionReason.trim()}>
              Reject Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}









