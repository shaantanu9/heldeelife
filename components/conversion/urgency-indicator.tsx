'use client'

import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UrgencyIndicatorProps {
  stockQuantity?: number
  lowStockThreshold?: number
  isOnSale?: boolean
  discountPercentage?: number
  endsAt?: Date
  className?: string
}

export function UrgencyIndicator({
  stockQuantity,
  lowStockThreshold = 10,
  isOnSale = false,
  discountPercentage,
  endsAt,
  className,
}: UrgencyIndicatorProps) {
  const isLowStock =
    stockQuantity !== undefined &&
    stockQuantity > 0 &&
    stockQuantity <= lowStockThreshold
  const isVeryLowStock =
    stockQuantity !== undefined && stockQuantity > 0 && stockQuantity <= 3
  const isOutOfStock = stockQuantity === 0

  // Calculate time remaining for sale
  const getTimeRemaining = () => {
    if (!endsAt) return null
    const now = new Date()
    const end = new Date(endsAt)
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return null

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h left`
    }
    return `${hours}h ${minutes}m left`
  }

  const timeRemaining = getTimeRemaining()

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {/* Stock Urgency */}
      {isVeryLowStock && (
        <Badge
          variant="destructive"
          className="flex items-center gap-1 animate-pulse"
        >
          <AlertCircle className="h-3 w-3" />
          Only {stockQuantity} left!
        </Badge>
      )}
      {isLowStock && !isVeryLowStock && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 bg-orange-100 text-orange-700 border-orange-200"
        >
          <AlertCircle className="h-3 w-3" />
          Low Stock ({stockQuantity} left)
        </Badge>
      )}
      {isOutOfStock && (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Out of Stock
        </Badge>
      )}

      {/* Sale Urgency */}
      {isOnSale && discountPercentage && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 bg-red-100 text-red-700 border-red-200"
        >
          <TrendingDown className="h-3 w-3" />
          {discountPercentage}% OFF
        </Badge>
      )}

      {/* Time-based Urgency */}
      {timeRemaining && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 bg-orange-100 text-orange-700 border-orange-200"
        >
          <Clock className="h-3 w-3" />
          {timeRemaining}
        </Badge>
      )}
    </div>
  )
}









