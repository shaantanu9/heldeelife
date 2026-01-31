'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  Truck,
  RotateCcw,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Cart Social Proof - Shows recent activity
export function CartSocialProof({ className }: { className?: string }) {
  return (
    <Card className={cn('border border-green-200 bg-green-50', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              50,000+ happy customers
            </p>
            <p className="text-xs text-gray-600">
              Join thousands who trust us for authentic Ayurvedic products
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Cart Trust Badges - Builds confidence
export function CartTrustBadges({ className }: { className?: string }) {
  const badges = [
    {
      icon: Shield,
      text: '100% Authentic',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Truck,
      text: 'Free Shipping',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: RotateCcw,
      text: '30-Day Returns',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: CheckCircle2,
      text: 'Secure Payment',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {badges.map((badge, index) => (
        <div
          key={index}
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg',
            badge.bgColor
          )}
        >
          <badge.icon className={cn('h-4 w-4 flex-shrink-0', badge.color)} />
          <span className="text-xs font-semibold text-gray-900">
            {badge.text}
          </span>
        </div>
      ))}
    </div>
  )
}

// Cart Urgency Indicator - Creates FOMO
export function CartUrgencyIndicator({
  lowStockItems,
  className,
}: {
  lowStockItems: number
  className?: string
}) {
  if (lowStockItems === 0) return null

  return (
    <Card
      className={cn(
        'border border-orange-200 bg-orange-50 animate-pulse',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-900">
              Limited Stock Alert!
            </p>
            <p className="text-xs text-orange-700">
              {lowStockItems} {lowStockItems === 1 ? 'item' : 'items'} in your
              cart have limited stock. Complete your purchase soon!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Cart Savings Display - Value perception
export function CartSavingsDisplay({
  originalTotal,
  currentTotal,
  className,
}: {
  originalTotal: number
  currentTotal: number
  className?: string
}) {
  const savings = originalTotal - currentTotal
  if (savings <= 0) return null

  return (
    <Card className={cn('border border-green-200 bg-green-50', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-sm font-semibold text-gray-900">
              You&apos;re Saving!
            </span>
          </div>
          <Badge className="bg-green-600 text-white text-sm font-bold px-3 py-1">
            Rs. {savings.toFixed(2)}
          </Badge>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Great deals on selected items in your cart
        </p>
      </CardContent>
    </Card>
  )
}

// Cart Recent Activity - Social proof
export function CartRecentActivity({ className }: { className?: string }) {
  return (
    <Card className={cn('border border-gray-200 bg-white', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-700">
            Recent Activity
          </span>
        </div>
        <p className="text-xs text-gray-600">
          <span className="font-semibold text-orange-600">12 people</span> added
          items to cart in the last hour
        </p>
      </CardContent>
    </Card>
  )
}

// Free Shipping Progress - Reciprocity & Urgency
export function CartFreeShippingProgress({
  currentTotal,
  threshold = 500,
  className,
}: {
  currentTotal: number
  threshold?: number
  className?: string
}) {
  const remaining = Math.max(0, threshold - currentTotal)
  const progress = Math.min(100, (currentTotal / threshold) * 100)
  const isFreeShipping = currentTotal >= threshold

  if (isFreeShipping) {
    return (
      <Card className={cn('border border-green-200 bg-green-50', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900">
                🎉 Free Shipping Unlocked!
              </p>
              <p className="text-xs text-green-700">
                Your order qualifies for free shipping
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('border border-orange-200 bg-orange-50', className)}>
      <CardContent className="p-4">
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-900">
              Add Rs. {remaining.toFixed(2)} more for free shipping!
            </span>
            <span className="text-xs text-gray-600">{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-gray-600">
          You&apos;re almost there! Add more items to unlock free shipping
        </p>
      </CardContent>
    </Card>
  )
}









