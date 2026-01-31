'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Star,
  Verified,
  ThumbsUp,
  User,
  MessageSquare,
  Image as ImageIcon,
  X,
  Award,
  TrendingUp,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { ReviewForm } from './review-form'
import { toast } from 'sonner'
import Image from 'next/image'

interface Review {
  id: string
  rating: number
  title?: string
  comment?: string
  review_images?: string[]
  is_verified_purchase: boolean
  helpful_count: number
  created_at: string
  admin_response?: string
  admin_response_at?: string
  users?: {
    full_name?: string
    email?: string
  }
}

interface ProductReviewsProps {
  productId: string
  productName: string
}

export function ProductReviews({
  productId,
  productName,
}: ProductReviewsProps) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [sortBy, setSortBy] = useState<
    'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'
  >('newest')
  const [filterRating, setFilterRating] = useState<number | 'all'>('all')
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({})
  const [ratingDistribution, setRatingDistribution] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  })

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(`/api/reviews?product_id=${productId}`)
      const data = await response.json()
      if (data.reviews) {
        setReviews(data.reviews)
        // Calculate rating distribution
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        data.reviews.forEach((r: Review) => {
          dist[r.rating as keyof typeof dist]++
        })
        setRatingDistribution(dist)

        // Fetch helpful vote status for each review
        if (session?.user) {
          const votePromises = data.reviews.map(async (review: Review) => {
            const voteResponse = await fetch(
              `/api/reviews/${review.id}/helpful`
            )
            const voteData = await voteResponse.json()
            return {
              reviewId: review.id,
              hasVoted: voteData.has_voted,
              isHelpful: voteData.is_helpful,
            }
          })
          const votes = await Promise.all(votePromises)
          const votesMap: Record<string, boolean> = {}
          votes.forEach((v) => {
            if (v.hasVoted) {
              votesMap[v.reviewId] = v.isHelpful
            }
          })
          setHelpfulVotes(votesMap)
        }
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setLoading(false)
    }
  }, [productId, session])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleHelpfulVote = useCallback(
    async (reviewId: string, isHelpful: boolean) => {
      if (!session?.user) {
        toast.error('Please sign in to vote')
        return
      }

      try {
        const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_helpful: isHelpful }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to vote')
        }

        // Update local state
        setHelpfulVotes((prev) => ({ ...prev, [reviewId]: isHelpful }))
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, helpful_count: data.helpful_count } : r
          )
        )
      } catch (error: any) {
        console.error('Error voting:', error)
        toast.error(error.message || 'Failed to vote')
      }
    },
    [session]
  )

  const sortedAndFilteredReviews = reviews
    .filter(
      (review) => filterRating === 'all' || review.rating === filterRating
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        case 'oldest':
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        case 'highest':
          return b.rating - a.rating
        case 'lowest':
          return a.rating - b.rating
        case 'helpful':
          return b.helpful_count - a.helpful_count
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-600">Loading reviews...</div>
    )
  }

  if (reviews.length === 0 && !showReviewForm) {
    return (
      <div className="space-y-6" id="reviews">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Customer Reviews</h2>
        </div>
        <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-orange-50/30">
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                <Star className="h-10 w-10 text-white fill-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Reviews Yet
              </h3>
              <p className="text-gray-600 mb-2">
                Be the first to share your experience!
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Your review will help other customers make informed decisions.
              </p>
              {session?.user ? (
                <Button
                  onClick={() => setShowReviewForm(true)}
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Star className="h-5 w-5 mr-2 fill-white" />
                  Write the First Review
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all w-full"
                  >
                    <a href="/auth/signin">Sign In to Write a Review</a>
                  </Button>
                  <p className="text-xs text-gray-500">
                    Sign in to share your experience and help others
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalReviews = reviews.length
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0

  return (
    <div className="space-y-6" id="reviews">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">
            Customer Reviews
          </h2>
          <p className="text-sm text-gray-600">
            Real experiences from verified customers
          </p>
        </div>
        {session?.user && !showReviewForm && (
          <Button
            onClick={() => setShowReviewForm(true)}
            size="lg"
            className="bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <Star className="h-5 w-5 mr-2 fill-white" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          productId={productId}
          productName={productName}
          onSuccess={() => {
            setShowReviewForm(false)
            fetchReviews()
          }}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {reviews.length > 0 && (
        <>
          {/* Review Summary Card - Conversion Focused */}
          <Card className="bg-gradient-to-br from-orange-50 via-white to-orange-50/50 border-2 border-orange-200 shadow-xl overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* Left: Rating Summary */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-8">
                  <div className="text-center sm:text-left">
                    <div className="flex items-baseline gap-2 mb-2">
                      <div className="text-6xl font-bold text-gray-900 leading-none">
                        {averageRating.toFixed(1)}
                      </div>
                      <div className="text-2xl text-gray-500">/ 5</div>
                    </div>
                    <div className="flex items-center gap-1 justify-center sm:justify-start mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-7 w-7 ${
                            i < Math.round(averageRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-base text-gray-700 font-semibold">
                      Based on{' '}
                      <span className="text-orange-600 font-bold">
                        {totalReviews}
                      </span>{' '}
                      {totalReviews === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    {/* Verified Purchase Count */}
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200 shadow-sm">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Verified className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-900">
                          {reviews.filter((r) => r.is_verified_purchase).length}
                        </div>
                        <p className="text-xs text-gray-600 font-medium">
                          Verified
                        </p>
                      </div>
                    </div>

                    {/* Review with Photos */}
                    {reviews.filter(
                      (r) => r.review_images && r.review_images.length > 0
                    ).length > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <ImageIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xl font-bold text-gray-900">
                            {
                              reviews.filter(
                                (r) =>
                                  r.review_images && r.review_images.length > 0
                              ).length
                            }
                          </div>
                          <p className="text-xs text-gray-600 font-medium">
                            With Photos
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: CTA Button */}
                <div className="w-full lg:w-auto lg:flex-shrink-0">
                  {session?.user && !showReviewForm && (
                    <Button
                      onClick={() => setShowReviewForm(true)}
                      size="lg"
                      className="w-full lg:w-auto bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all text-base px-8 py-6 h-auto"
                    >
                      <Star className="h-5 w-5 mr-2 fill-white" />
                      Write a Review
                    </Button>
                  )}
                  {!session?.user && (
                    <Button
                      asChild
                      size="lg"
                      className="w-full lg:w-auto bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all text-base px-8 py-6 h-auto"
                    >
                      <a href="/auth/signin">Sign In to Review</a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rating Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rating Breakdown
            </h3>

            {/* Rating Distribution - Enhanced */}
            <div className="space-y-3 mb-6">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count =
                  ratingDistribution[rating as keyof typeof ratingDistribution]
                const percentage =
                  totalReviews > 0 ? (count / totalReviews) * 100 : 0
                const isActive = filterRating === rating
                return (
                  <button
                    key={rating}
                    onClick={() =>
                      setFilterRating(filterRating === rating ? 'all' : rating)
                    }
                    className={`flex items-center gap-4 w-full hover:bg-orange-50 p-3 rounded-lg transition-all border-2 ${
                      isActive
                        ? 'bg-orange-50 border-orange-300 shadow-sm'
                        : 'bg-white border-transparent hover:border-orange-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-24">
                      <span className="text-base font-bold text-gray-900">
                        {rating}
                      </span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full transition-all duration-500 ${
                          rating >= 4
                            ? 'bg-green-500'
                            : rating === 3
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-16 text-right">
                      {count} {count === 1 ? 'review' : 'reviews'}
                    </span>
                    {percentage > 0 && (
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {percentage.toFixed(0)}%
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Review Highlights - Key Insights */}
          {reviews.length >= 3 && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">
                    What Customers Are Saying
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Top Rated Reviews */}
                  {reviews.filter((r) => r.rating >= 4).length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-900">
                          {Math.round(
                            (reviews.filter((r) => r.rating >= 4).length /
                              totalReviews) *
                              100
                          )}
                          % Positive
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {reviews.filter((r) => r.rating >= 4).length} out of{' '}
                        {totalReviews} customers rated this product 4+ stars
                      </p>
                    </div>
                  )}

                  {/* Verified Purchases */}
                  {reviews.filter((r) => r.is_verified_purchase).length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Verified className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-gray-900">
                          Verified Buyers
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {reviews.filter((r) => r.is_verified_purchase).length}{' '}
                        verified customers have reviewed this product
                      </p>
                    </div>
                  )}

                  {/* Reviews with Photos */}
                  {reviews.filter(
                    (r) => r.review_images && r.review_images.length > 0
                  ).length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">
                          Photo Reviews
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {
                          reviews.filter(
                            (r) => r.review_images && r.review_images.length > 0
                          ).length
                        }{' '}
                        customers shared photos of their purchase
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters and Sort - Enhanced */}
          <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Sort by:
              </span>
              <Select
                value={sortBy}
                onValueChange={(value: any) => setSortBy(value)}
              >
                <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="helpful">Most Helpful</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="highest">Highest Rating</SelectItem>
                  <SelectItem value="lowest">Lowest Rating</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filterRating !== 'all' && (
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-800 border-orange-300 cursor-pointer hover:bg-orange-200"
                onClick={() => setFilterRating('all')}
              >
                {filterRating} Stars
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            <div className="ml-auto text-sm text-gray-600 font-medium">
              Showing {sortedAndFilteredReviews.length} of {totalReviews}{' '}
              reviews
            </div>
          </div>

          {/* Reviews List - Enhanced */}
          <div className="space-y-4">
            {sortedAndFilteredReviews.map((review) => (
              <Card
                key={review.id}
                className={`border transition-all hover:shadow-lg ${
                  review.is_verified_purchase
                    ? 'border-green-200 bg-green-50/30'
                    : 'border-gray-200'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md flex-shrink-0">
                          <span className="text-white font-bold text-lg">
                            {(review.users?.full_name || 'A')[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-gray-900 text-base">
                              {review.users?.full_name || 'Anonymous Customer'}
                            </span>
                            {review.is_verified_purchase && (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800 border-green-300 text-xs font-semibold"
                              >
                                <Verified className="h-3 w-3 mr-1" />
                                Verified Purchase
                              </Badge>
                            )}
                            {review.helpful_count > 5 && (
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-800 border-blue-300 text-xs"
                              >
                                <Award className="h-3 w-3 mr-1" />
                                Top Contributor
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
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
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(review.created_at).toLocaleDateString(
                                'en-IN',
                                {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.title && (
                        <h4 className="font-bold text-lg text-gray-900 mb-2">
                          {review.title}
                        </h4>
                      )}
                      {review.comment && (
                        <p className="text-gray-700 leading-relaxed mb-4 text-base">
                          {review.comment}
                        </p>
                      )}

                      {/* Review Images - Enhanced */}
                      {review.review_images &&
                        review.review_images.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <ImageIcon className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">
                                Customer Photos ({review.review_images.length})
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {review.review_images.map((img, idx) => (
                                <div
                                  key={idx}
                                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer group shadow-sm hover:shadow-md transition-all hover:border-orange-400"
                                  onClick={() => {
                                    // Open in lightbox (you can implement this)
                                    window.open(img, '_blank')
                                  }}
                                >
                                  <Image
                                    src={img}
                                    alt={`Review image ${idx + 1}`}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                                    unoptimized
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Admin Response - Enhanced */}
                      {review.admin_response && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg border-2 border-blue-300 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-blue-600 rounded-full">
                              <MessageSquare className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-bold text-blue-900">
                              Response from Seller
                            </span>
                          </div>
                          <p className="text-sm text-blue-800 leading-relaxed">
                            {review.admin_response}
                          </p>
                          {review.admin_response_at && (
                            <p className="text-xs text-blue-600 mt-2 font-medium">
                              {new Date(
                                review.admin_response_at
                              ).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Helpful Button - Enhanced */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleHelpfulVote(
                          review.id,
                          helpfulVotes[review.id] ? false : true
                        )
                      }
                      className={`transition-all ${
                        helpfulVotes[review.id]
                          ? 'text-orange-600 hover:text-orange-700 bg-orange-50'
                          : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                      }`}
                    >
                      <ThumbsUp
                        className={`h-4 w-4 mr-2 transition-all ${
                          helpfulVotes[review.id]
                            ? 'fill-orange-600 text-orange-600'
                            : ''
                        }`}
                      />
                      <span className="font-medium">
                        Helpful
                        {review.helpful_count > 0 && (
                          <span className="ml-1">
                            ({review.helpful_count}{' '}
                            {review.helpful_count === 1 ? 'person' : 'people'}{' '}
                            found this helpful)
                          </span>
                        )}
                      </span>
                    </Button>
                    {review.helpful_count > 10 && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 border-green-300"
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Highly Rated
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
