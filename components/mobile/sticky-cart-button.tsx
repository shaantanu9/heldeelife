'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/contexts/cart-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart } from 'lucide-react'
import { CartDrawer } from './cart-drawer'
import { cn } from '@/lib/utils'
import { useHapticFeedback } from '@/hooks/use-haptic-feedback'

export function StickyCartButton() {
  const { totalItems, totalPrice } = useCart()
  const [isVisible, setIsVisible] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const { trigger } = useHapticFeedback()

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Show button when scrolled down 200px and not at bottom
      const shouldShow =
        scrollY > 200 && scrollY < documentHeight - windowHeight - 100

      setIsVisible(shouldShow)
      setIsScrolling(true)

      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [])

  if (totalItems === 0) return null

  const tax = totalPrice * 0.18
  const finalTotal = totalPrice + tax

  return (
    <div
      className={cn(
        'fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 transition-all duration-300',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
      )}
    >
      <CartDrawer>
        <Button
          onClick={() => trigger('light')}
          className={cn(
            'w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-14 px-6',
            isScrolling && 'scale-95'
          )}
          size="lg"
        >
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
                  >
                    {totalItems > 9 ? '9+' : totalItems}
                  </Badge>
                )}
              </div>
              <div className="text-left md:text-center">
                <div className="text-xs opacity-90">Cart Total</div>
                <div className="text-base font-bold">
                  Rs. {finalTotal.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="hidden md:block text-sm font-semibold">
              View Cart
            </div>
          </div>
        </Button>
      </CartDrawer>
    </div>
  )
}









