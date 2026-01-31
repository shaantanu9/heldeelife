'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface OrderStatusBadgeProps {
  status: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function OrderStatusBadge({
  status,
  className,
  size = 'md',
}: OrderStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'refunded':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5'
      case 'lg':
        return 'text-base px-4 py-2'
      default:
        return 'text-sm px-3 py-1'
    }
  }

  const formattedStatus =
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()

  return (
    <Badge
      className={cn(
        'border font-semibold',
        getStatusColor(status),
        getSizeClasses(),
        className
      )}
    >
      {formattedStatus}
    </Badge>
  )
}








