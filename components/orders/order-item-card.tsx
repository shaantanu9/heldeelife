'use client'

import React from 'react'
import Image from 'next/image'
import { Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrderItem {
  id: string
  product_id?: string
  product_name: string
  product_sku?: string
  product_image?: string
  quantity: number
  unit_price: number
  total_price: number
  discount_amount?: number
}

interface OrderItemCardProps {
  item: OrderItem
  className?: string
  showImage?: boolean
  compact?: boolean
}

export function OrderItemCard({
  item,
  className,
  showImage = true,
  compact = false,
}: OrderItemCardProps) {
  const [imageError, setImageError] = React.useState(false)

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 bg-gray-50 rounded-lg',
        compact && 'p-3',
        className
      )}
    >
      {showImage && (
        <div
          className={cn(
            'bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0',
            compact ? 'w-16 h-16' : 'w-20 h-20'
          )}
        >
          {item.product_image && !imageError ? (
            <div
              className={cn('relative', compact ? 'w-16 h-16' : 'w-20 h-20')}
            >
              <Image
                src={item.product_image}
                alt={item.product_name}
                fill
                className="object-cover rounded-lg"
                unoptimized
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <Package
              className={cn('text-orange-600', compact ? 'h-6 w-6' : 'h-8 w-8')}
            />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={cn('font-semibold text-gray-900', compact && 'text-sm')}>
          {item.product_name}
        </p>
        <p className={cn('text-sm text-gray-600', compact && 'text-xs')}>
          Qty: {item.quantity} × Rs. {Number(item.unit_price).toFixed(2)}
        </p>
        {item.product_sku && (
          <p className={cn('text-xs text-gray-500', compact && 'text-xs')}>
            SKU: {item.product_sku}
          </p>
        )}
        {item.discount_amount && item.discount_amount > 0 && (
          <p className="text-xs text-green-600 mt-1">
            Discount: Rs. {Number(item.discount_amount).toFixed(2)}
          </p>
        )}
      </div>
      <div className="text-right">
        <p
          className={cn(
            'font-semibold text-gray-900',
            compact ? 'text-sm' : 'text-base'
          )}
        >
          Rs. {Number(item.total_price).toFixed(2)}
        </p>
      </div>
    </div>
  )
}
