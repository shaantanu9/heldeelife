'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, X, Star } from 'lucide-react'
import { useToast } from '@/contexts/toast-context'

interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  title: string | null
  comment: string | null
  review_images?: string[] | null
  is_verified_purchase: boolean
  is_approved: boolean
  moderation_status?: string
  helpful_count: number
  admin_response?: string | null
  created_at: string
  products?: {
    id: string
    name: string
  }
  users?: {
    id: string
    full_name: string
    email: string
  }
}

export function AdminReviewsClient() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const toast = useToast()

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter === 'pending') {
        params.append('approved', 'false')
        params.append('status', 'pending')
      } else if (statusFilter === 'approved') {
        params.append('approved', 'true')
        params.append('status', 'approved')
      } else if (statusFilter === 'rejected') {
        params.append('status', 'rejected')
      } else if (statusFilter === 'flagged') {
        params.append('status', 'flagged')
      }

      const response = await fetch(`/api/reviews?${params.toString()}`)
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, toast])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_approved: true,
          moderation_status: 'approved',
        }),
      })

      if (!response.ok) throw new Error('Failed to approve review')

      toast.success('Review approved successfully')
      fetchReviews()
    } catch (error) {
      console.error('Error approving review:', error)
      toast.error('Failed to approve review')
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to reject this review?')) return

    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_approved: false,
          moderation_status: 'rejected',
        }),
      })

      if (!response.ok) throw new Error('Failed to reject review')

      toast.success('Review rejected')
      fetchReviews()
    } catch (error) {
      console.error('Error rejecting review:', error)
      toast.error('Failed to reject review')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete review')

      toast.success('Review deleted successfully')
      fetchReviews()
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error('Failed to delete review')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const pendingCount = reviews.filter(
    (r) =>
      r.moderation_status === 'pending' ||
      (!r.moderation_status && !r.is_approved)
  ).length
  const approvedCount = reviews.filter(
    (r) =>
      r.moderation_status === 'approved' ||
      (!r.moderation_status && r.is_approved)
  ).length
  const rejectedCount = reviews.filter(
    (r) => r.moderation_status === 'rejected'
  ).length
  const flaggedCount = reviews.filter(
    (r) => r.moderation_status === 'flagged'
  ).length

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Review <span className="text-orange-600">Moderation</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and moderate product reviews
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
            <SelectItem value="approved">Approved ({approvedCount})</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {approvedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rejectedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
          <CardDescription>
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No reviews found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">
                      {review.products?.name || 'Unknown Product'}
                    </TableCell>
                    <TableCell>
                      {review.users?.full_name ||
                        review.users?.email ||
                        'Anonymous'}
                      {review.is_verified_purchase && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Verified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-sm text-gray-600">
                          ({review.rating})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        {review.title && (
                          <p className="font-semibold text-sm mb-1">
                            {review.title}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {review.comment || 'No comment'}
                        </p>
                        {review.review_images &&
                          review.review_images.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {review.review_images
                                .slice(0, 3)
                                .map((img, idx) => (
                                  <div
                                    key={idx}
                                    className="relative w-12 h-12 rounded border overflow-hidden"
                                  >
                                    <Image
                                      src={img}
                                      alt={`Review image ${idx + 1}`}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  </div>
                                ))}
                              {review.review_images.length > 3 && (
                                <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs">
                                  +{review.review_images.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        {review.admin_response && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                            <p className="font-semibold text-blue-900">
                              Admin Response:
                            </p>
                            <p className="text-blue-800">
                              {review.admin_response}
                            </p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          review.moderation_status === 'approved' ||
                          (!review.moderation_status && review.is_approved)
                            ? 'default'
                            : review.moderation_status === 'rejected'
                              ? 'destructive'
                              : review.moderation_status === 'flagged'
                                ? 'outline'
                                : 'secondary'
                        }
                      >
                        {review.moderation_status === 'approved' ||
                        (!review.moderation_status && review.is_approved)
                          ? 'Approved'
                          : review.moderation_status === 'rejected'
                            ? 'Rejected'
                            : review.moderation_status === 'flagged'
                              ? 'Flagged'
                              : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(review.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(review.moderation_status === 'pending' ||
                          (!review.moderation_status &&
                            !review.is_approved)) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(review.id)}
                            className="text-green-600 hover:text-green-700"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {(review.moderation_status === 'approved' ||
                          (!review.moderation_status &&
                            review.is_approved)) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(review.id)}
                            className="text-yellow-600 hover:text-yellow-700"
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(review.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
