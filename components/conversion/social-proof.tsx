'use client'

import { Badge } from '@/components/ui/badge'
import { Users, Star, ShoppingBag, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SocialProofProps {
  reviewsCount?: number
  averageRating?: number
  recentPurchases?: number
  salesCount?: number
  className?: string
  variant?: 'compact' | 'detailed'
}

export function SocialProof({
  reviewsCount = 0,
  averageRating = 0,
  recentPurchases,
  salesCount,
  className,
  variant = 'compact',
}: SocialProofProps) {
  const hasReviews = reviewsCount > 0
  const hasRecentActivity = recentPurchases !== undefined && recentPurchases > 0

  if (variant === 'compact') {
    return (
      <div
        className={cn('flex flex-wrap items-center gap-2 text-sm', className)}
      >
        {hasReviews && (
          <div className="flex items-center gap-1 text-gray-600">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{averageRating.toFixed(1)}</span>
            <span className="text-gray-500">({reviewsCount})</span>
          </div>
        )}
        {hasRecentActivity && (
          <Badge
            variant="secondary"
            className="text-xs bg-green-50 text-green-700 border-green-200"
          >
            <Users className="h-3 w-3 mr-1" />
            {recentPurchases} bought recently
          </Badge>
        )}
        {salesCount && salesCount > 0 && (
          <span className="text-xs text-gray-500">
            <TrendingUp className="h-3 w-3 inline mr-1" />
            {salesCount}+ sold
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {hasReviews && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-4 w-4',
                  i < Math.round(averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-600">
            ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      )}

      {hasRecentActivity && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4 text-green-600" />
          <span>
            {recentPurchases} {recentPurchases === 1 ? 'person' : 'people'}{' '}
            bought this recently
          </span>
        </div>
      )}

      {salesCount && salesCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ShoppingBag className="h-4 w-4 text-orange-600" />
          <span>{salesCount}+ sold this month</span>
        </div>
      )}
    </div>
  )
}









