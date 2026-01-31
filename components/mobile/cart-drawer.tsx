'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/contexts/cart-context'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useHapticFeedback } from '@/hooks/use-haptic-feedback'

interface CartDrawerProps {
  children?: React.ReactNode
}

export function CartDrawer({ children }: CartDrawerProps) {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    totalItems,
    totalPrice,
    clearCart,
  } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const router = useRouter()
  const { trigger } = useHapticFeedback()

  // Close drawer when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [router])

  const handleRemove = (id: string) => {
    trigger('medium')
    setIsRemoving(id)
    setTimeout(() => {
      removeFromCart(id)
      setIsRemoving(null)
      toast.success('Item removed from cart')
    }, 200)
  }

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemove(id)
      return
    }
    trigger('light')
    updateQuantity(id, newQuantity)
  }

  const handleCheckout = () => {
    trigger('success')
    setIsOpen(false)
    router.push('/checkout')
  }

  const handleClearCart = () => {
    trigger('warning')
    if (confirm('Are you sure you want to clear your cart?')) {
      clearCart()
      toast.success('Cart cleared')
    }
  }

  const tax = totalPrice * 0.18
  const finalTotal = totalPrice + tax

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {children || (
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {totalItems > 9 ? '9+' : totalItems}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
      )}
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col p-0"
      >
        <SheetHeader className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold text-gray-900">
              Shopping Cart
            </SheetTitle>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                Clear All
              </Button>
            )}
          </div>
          {totalItems > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </p>
          )}
        </SheetHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your cart is empty
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Add items to your cart to get started
              </p>
              <Button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/shop')
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex gap-4 p-4 bg-white rounded-lg border border-gray-200 transition-all',
                    isRemoving === item.id && 'opacity-50 scale-95'
                  )}
                >
                  {/* Product Image */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {item.image && item.image.startsWith('http') ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl">{item.image || '📦'}</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 line-clamp-2">
                      {item.name}
                    </h4>
                    <p className="text-orange-600 font-bold text-sm sm:text-base mb-2">
                      Rs. {Number(item.price).toFixed(2)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          disabled={isRemoving === item.id}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          disabled={isRemoving === item.id}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemove(item.id)}
                        disabled={isRemoving === item.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Subtotal */}
                    <p className="text-xs text-gray-500 mt-2">
                      Subtotal: Rs. {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary & Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 bg-white px-4 py-4 safe-area-inset-bottom">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 font-semibold">
                  Rs. {totalPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (18%)</span>
                <span className="text-gray-900 font-semibold">
                  Rs. {tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-green-600 font-semibold">Free</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-orange-600">
                  Rs. {finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleCheckout}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-base font-semibold"
                size="lg"
              >
                Proceed to Checkout
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false)
                  router.push('/cart')
                }}
                className="w-full"
              >
                View Full Cart
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}









