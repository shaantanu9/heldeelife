'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, Verified, ThumbsUp, User } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Review {
  id: string
  rating: number
  title?: string
  comment?: string
  is_verified_purchase: boolean
  helpful_count: number
  created_at: string
  users?: {
    full_name?: string
    email?: string
  }
}

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingDistribution, setRatingDistribution] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  })

  useEffect(() => {
    fetch(`/api/reviews?product_id=${productId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews) {
          setReviews(data.reviews)
          // Calculate rating distribution
          const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          data.reviews.forEach((r: Review) => {
            dist[r.rating as keyof typeof dist]++
          })
          setRatingDistribution(dist)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [productId])

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-600">Loading reviews...</div>
    )
  }

  if (reviews.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600 mb-4">No reviews yet</p>
          <p className="text-sm text-gray-500">
            Be the first to review this product!
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalReviews = reviews.length
  const averageRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews

  return (
    <div className="space-y-6" id="reviews">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Customer Reviews
        </h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-gray-600">
            ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2 mb-6">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count =
              ratingDistribution[rating as keyof typeof ratingDistribution]
            const percentage =
              totalReviews > 0 ? (count / totalReviews) * 100 : 0
            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-sm font-semibold">{rating}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {review.users?.full_name || 'Anonymous'}
                        </span>
                        {review.is_verified_purchase && (
                          <Badge variant="secondary" className="text-xs">
                            <Verified className="h-3 w-3 mr-1" />
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
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
                    </div>
                  </div>
                  {review.title && (
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {review.title}
                    </h4>
                  )}
                  {review.comment && (
                    <p className="text-gray-600 leading-relaxed mb-3">
                      {review.comment}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              {review.helpful_count > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 pt-3 border-t">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{review.helpful_count} people found this helpful</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
