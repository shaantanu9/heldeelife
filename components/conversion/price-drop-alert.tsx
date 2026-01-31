'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Bell, TrendingDown, Mail } from 'lucide-react'
import { useWishlist } from '@/contexts/wishlist-context'
import { toast } from 'sonner'
import { AnalyticsTracker } from '@/lib/analytics/tracking'

interface PriceDropAlertProps {
  productId: string
  productName: string
  currentPrice: number
  previousPrice?: number
  variant?: 'button' | 'icon' | 'inline'
}

export function PriceDropAlert({
  productId,
  productName,
  currentPrice,
  previousPrice,
  variant = 'button',
}: PriceDropAlertProps) {
  const { isInWishlist } = useWishlist()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  // Check if already subscribed
  useEffect(() => {
    const subscriptions = JSON.parse(
      localStorage.getItem('heldeelife-price-alerts') || '[]'
    )
    setIsSubscribed(subscriptions.some((s: any) => s.productId === productId))
  }, [productId])

  const handleSubscribe = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    setIsSubmitting(true)
    try {
      // Save to localStorage
      const subscriptions = JSON.parse(
        localStorage.getItem('heldeelife-price-alerts') || '[]'
      )
      subscriptions.push({
        productId,
        productName,
        email,
        currentPrice,
        subscribedAt: new Date().toISOString(),
      })
      localStorage.setItem(
        'heldeelife-price-alerts',
        JSON.stringify(subscriptions)
      )

      // Send to API
      await fetch('/api/products/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productName,
          email,
          currentPrice,
        }),
      })

      setIsSubscribed(true)
      setIsOpen(false)
      
      // Track analytics
      AnalyticsTracker.trackPriceAlertSubscribe(productId, productName)
      
      toast.success(
        `We'll notify you when the price drops for ${productName}`,
        {
          duration: 5000,
        }
      )
    } catch (error) {
      console.error('Error subscribing to price alert:', error)
      toast.error('Failed to subscribe. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubscribed) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Bell className="h-4 w-4 fill-green-600" />
        <span>Price alerts enabled</span>
      </div>
    )
  }

  if (variant === 'icon') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" title="Get price drop alerts">
            <Bell className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Get Price Drop Alerts</DialogTitle>
            <DialogDescription>
              We&apos;ll notify you when the price drops for {productName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-2"
              />
            </div>
            <Button
              onClick={handleSubscribe}
              disabled={isSubmitting}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Bell className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Subscribing...' : 'Notify Me'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (variant === 'inline') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            Notify Me When Price Drops
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              Price Drop Alert
            </DialogTitle>
            <DialogDescription>
              Get notified when {productName} goes on sale
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {previousPrice && previousPrice > currentPrice && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  <span className="font-semibold">Price dropped!</span> Was Rs.{' '}
                  {previousPrice.toFixed(2)}, now Rs. {currentPrice.toFixed(2)}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="email-inline">Email Address</Label>
              <Input
                id="email-inline"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-2"
              />
            </div>
            <Button
              onClick={handleSubscribe}
              disabled={isSubmitting}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Mail className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Subscribing...' : 'Subscribe to Price Alerts'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Bell className="h-4 w-4" />
          Notify Me When Price Drops
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get Price Drop Alerts</DialogTitle>
          <DialogDescription>
            We&apos;ll email you when {productName} goes on sale
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="email-button">Email Address</Label>
            <Input
              id="email-button"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-2"
            />
          </div>
          <Button
            onClick={handleSubscribe}
            disabled={isSubmitting}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <Bell className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Subscribing...' : 'Notify Me'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

