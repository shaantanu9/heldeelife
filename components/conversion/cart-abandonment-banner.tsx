'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  Clock,
  ShoppingCart,
  ArrowRight,
  X,
} from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { AnalyticsTracker } from '@/lib/analytics/tracking'

interface CartAbandonmentBannerProps {
  className?: string
}

export function CartAbandonmentBanner({
  className,
}: CartAbandonmentBannerProps) {
  const { cart, totalPrice, totalItems } = useCart()
  const router = useRouter()
  const [timeInCart, setTimeInCart] = useState(0)
  const [isDismissed, setIsDismissed] = useState(false)
  const [showUrgency, setShowUrgency] = useState(false)

  useEffect(() => {
    if (cart.length === 0 || isDismissed) return

    // Start timer when cart has items
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000) // seconds
      setTimeInCart(elapsed)

      // Show urgency after 2 minutes
      if (elapsed > 120 && !showUrgency) {
        setShowUrgency(true)
        AnalyticsTracker.trackEvent({
          event: 'cart_urgency_shown',
          category: 'Ecommerce',
          action: 'Cart Urgency Shown',
          metadata: {
            time_in_cart: elapsed,
            cart_value: totalPrice,
            item_count: totalItems,
          },
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [cart.length, isDismissed, showUrgency, totalPrice, totalItems])

  const handleDismiss = () => {
    setIsDismissed(true)
    AnalyticsTracker.trackEvent({
      event: 'cart_abandonment_banner_dismissed',
      category: 'Ecommerce',
      action: 'Banner Dismissed',
      metadata: {
        time_in_cart: timeInCart,
        cart_value: totalPrice,
      },
    })
  }

  const handleCheckout = () => {
    AnalyticsTracker.trackEvent({
      event: 'cart_abandonment_banner_checkout',
      category: 'Ecommerce',
      action: 'Banner Checkout Click',
      metadata: {
        time_in_cart: timeInCart,
        cart_value: totalPrice,
      },
    })
    router.push('/checkout')
  }

  // Don't show if cart is empty or dismissed
  if (cart.length === 0 || isDismissed) return null

  // Show urgency banner after 2 minutes
  if (!showUrgency) return null

  const minutes = Math.floor(timeInCart / 60)
  const seconds = timeInCart % 60

  return (
    <Card
      className={cn(
        'border border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 animate-pulse',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <p className="text-sm font-semibold text-orange-900">
                  Don&apos;t lose your items!
                </p>
              </div>
              <p className="text-xs text-orange-700 mb-2">
                Your cart has been waiting for {minutes}m {seconds}s. Complete
                your purchase before items run out of stock!
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-orange-600 text-white text-xs">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </Badge>
                <Badge className="bg-orange-600 text-white text-xs">
                  Rs. {totalPrice.toFixed(2)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-orange-600 hover:bg-orange-200"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleCheckout}
              className="bg-orange-600 hover:bg-orange-700 text-white whitespace-nowrap"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Checkout Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}









