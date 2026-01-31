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
import { Bell, Package, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface BackInStockAlertProps {
  productId: string
  productName: string
  isInStock: boolean
  variant?: 'button' | 'icon' | 'inline'
}

export function BackInStockAlert({
  productId,
  productName,
  isInStock,
  variant = 'button',
}: BackInStockAlertProps) {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  // Check if already subscribed
  useEffect(() => {
    const subscriptions = JSON.parse(
      localStorage.getItem('heldeelife-stock-alerts') || '[]'
    )
    setIsSubscribed(subscriptions.some((s: any) => s.productId === productId))
  }, [productId])

  // If product is back in stock and user was subscribed, show notification
  useEffect(() => {
    if (isInStock && isSubscribed) {
      const subscriptions = JSON.parse(
        localStorage.getItem('heldeelife-stock-alerts') || '[]'
      )
      const subscription = subscriptions.find(
        (s: any) => s.productId === productId
      )
      if (subscription) {
        toast.success(`${productName} is back in stock!`, {
          duration: 10000,
          action: {
            label: 'View Product',
            onClick: () => {
              window.location.href = `/products/${productId}`
            },
          },
        })
        // Remove subscription
        const updated = subscriptions.filter(
          (s: any) => s.productId !== productId
        )
        localStorage.setItem('heldeelife-stock-alerts', JSON.stringify(updated))
        setIsSubscribed(false)
      }
    }
  }, [isInStock, isSubscribed, productId, productName])

  const handleSubscribe = async () => {
    if (!email.trim() && !phone.trim()) {
      toast.error('Please enter your email or phone number')
      return
    }

    setIsSubmitting(true)
    try {
      // Save to localStorage
      const subscriptions = JSON.parse(
        localStorage.getItem('heldeelife-stock-alerts') || '[]'
      )
      subscriptions.push({
        productId,
        productName,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        subscribedAt: new Date().toISOString(),
      })
      localStorage.setItem(
        'heldeelife-stock-alerts',
        JSON.stringify(subscriptions)
      )

      // Send to API
      await fetch('/api/products/stock-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productName,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      })

      setIsSubscribed(true)
      setIsOpen(false)
      toast.success(`We'll notify you when ${productName} is back in stock`, {
        duration: 5000,
      })
    } catch (error) {
      console.error('Error subscribing to stock alert:', error)
      toast.error('Failed to subscribe. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isInStock) return null

  if (isSubscribed) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Bell className="h-4 w-4 fill-green-600" />
        <span>Stock alerts enabled</span>
      </div>
    )
  }

  if (variant === 'icon') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" title="Notify when back in stock">
            <Bell className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notify Me When Back in Stock</DialogTitle>
            <DialogDescription>
              We&apos;ll notify you when {productName} is available again
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="email-stock">Email Address</Label>
              <Input
                id="email-stock"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="phone-stock">Phone Number (Optional)</Label>
              <Input
                id="phone-stock"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
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
            <Package className="h-4 w-4" />
            Notify When Back in Stock
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              Back in Stock Alert
            </DialogTitle>
            <DialogDescription>
              Get notified when {productName} is available again
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="email-inline-stock">Email Address</Label>
              <Input
                id="email-inline-stock"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="phone-inline-stock">
                Phone Number (Optional)
              </Label>
              <Input
                id="phone-inline-stock"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="mt-2"
              />
            </div>
            <Button
              onClick={handleSubscribe}
              disabled={isSubmitting}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Mail className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Subscribing...' : 'Subscribe to Stock Alerts'}
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
          Notify Me When Back in Stock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Back in Stock Alert</DialogTitle>
          <DialogDescription>
            We&apos;ll notify you when {productName} is available again
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="email-button-stock">Email Address</Label>
            <Input
              id="email-button-stock"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="phone-button-stock">Phone Number (Optional)</Label>
            <Input
              id="phone-button-stock"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
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









