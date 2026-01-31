'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAbandonedCart } from '@/contexts/abandoned-cart-context'
import { useCart } from '@/contexts/cart-context'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ShoppingCart, X, Mail, ArrowRight, Clock } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export function AbandonedCartRecovery() {
  const { abandonedCarts, recoverCart } = useAbandonedCart()
  const { cart, addToCart, clearCart } = useCart()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentCart, setCurrentCart] = useState(
    abandonedCarts.length > 0 ? abandonedCarts[0] : null
  )

  useEffect(() => {
    if (abandonedCarts.length > 0 && !currentCart) {
      setCurrentCart(abandonedCarts[0])
      setIsOpen(true)
    }
  }, [abandonedCarts, currentCart])

  const handleRecoverCart = async () => {
    if (!currentCart) return

    setIsSubmitting(true)
    try {
      // Restore items to cart
      clearCart()
      currentCart.items.forEach((item) => {
        addToCart({
          id: item.id,
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          image: item.image,
          sku: item.sku,
        })
      })

      // Mark as recovered
      await recoverCart(currentCart.id)

      // Save email if provided
      if (email) {
        await fetch('/api/cart/abandoned/recover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartId: currentCart.id,
            email,
          }),
        })
      }

      toast.success('Cart restored! Continue to checkout?', {
        action: {
          label: 'Checkout',
          onClick: () => router.push('/checkout'),
        },
      })

      setIsOpen(false)
      router.push('/checkout')
    } catch (error) {
      console.error('Error recovering cart:', error)
      toast.error('Failed to recover cart. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDismiss = async () => {
    if (!currentCart) return

    // Mark as dismissed (don't show again)
    await recoverCart(currentCart.id)
    setIsOpen(false)
  }

  if (!currentCart || currentCart.recovered) return null

  const timeSinceAbandonment = Math.floor(
    (Date.now() - new Date(currentCart.abandonedAt).getTime()) /
      (1000 * 60 * 60)
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-orange-600" />
            You left items in your cart!
          </DialogTitle>
          <DialogDescription className="text-base">
            {currentCart.items.length} item
            {currentCart.items.length !== 1 ? 's' : ''} waiting for you
            {timeSinceAbandonment > 0 && (
              <span className="text-gray-500">
                {' '}
                (abandoned {timeSinceAbandonment} hour
                {timeSinceAbandonment !== 1 ? 's' : ''} ago)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Cart Items */}
          <div className="space-y-3">
            {currentCart.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="relative w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                  {item.image && item.image.startsWith('http') ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain"
                      sizes="80px"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl">{item.image || '📦'}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {item.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                  <p className="text-orange-600 font-semibold">
                    Rs. {Number(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
            <span className="text-lg font-semibold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-orange-600">
              Rs. {Number(currentCart.totalPrice).toFixed(2)}
            </span>
          </div>

          {/* Email Capture (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Get notified about price drops (optional)
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleRecoverCart}
                disabled={isSubmitting}
              >
                <Mail className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Maybe Later
            </Button>
            <Button
              onClick={handleRecoverCart}
              disabled={isSubmitting}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Restore Cart
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Trust Signals */}
          <div className="flex items-center justify-center gap-4 pt-4 border-t text-xs text-gray-600">
            <span>🔒 Secure Checkout</span>
            <span>✓ Free Shipping Available</span>
            <span>↩️ Easy Returns</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}









