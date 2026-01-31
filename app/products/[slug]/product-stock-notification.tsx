'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Bell, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface ProductStockNotificationProps {
  productId: string
  productName: string
}

export function ProductStockNotification({
  productId,
  productName,
}: ProductStockNotificationProps) {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email && !phone) {
      toast.error('Please provide either email or phone number')
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Implement API endpoint for stock notifications
      // const response = await fetch("/api/products/stock-notifications", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     product_id: productId,
      //     email,
      //     phone,
      //   }),
      // })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success(
        'You&apos;ll be notified when this product is back in stock!'
      )
      setEmail('')
      setPhone('')
      setIsOpen(false)
    } catch (error) {
      console.error('Error submitting notification:', error)
      toast.error('Failed to set up notification. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
        >
          <Bell className="h-4 w-4 mr-2" />
          Notify Me When Available
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get Notified When Back in Stock</DialogTitle>
          <DialogDescription>
            We&apos;ll send you an email or SMS when {productName} is back in
            stock.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={isSubmitting || (!email && !phone)}
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Notify Me
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}









