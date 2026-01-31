'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function ProductCardSkeleton() {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-0">
        <Skeleton className="aspect-square w-full rounded-t-lg" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Image */}
      <Skeleton className="aspect-square w-full rounded-lg" />

      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Price */}
      <Skeleton className="h-10 w-1/3" />

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Buttons */}
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function ShopPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-1/2" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 flex-shrink-0 rounded-full" />
        ))}
      </div>

      {/* Products */}
      <ProductGridSkeleton count={6} />
    </div>
  )
}









