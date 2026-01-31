'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { useCart } from './cart-context'
import { useSession } from 'next-auth/react'

interface AbandonedCart {
  id: string
  items: Array<{
    id: string
    product_id: string
    name: string
    price: number
    image: string
    quantity: number
    sku?: string
  }>
  totalPrice: number
  abandonedAt: string
  email?: string
  phone?: string
  recoveryAttempts: number
  lastRecoveryAttempt?: string
  recovered: boolean
}

interface AbandonedCartContextType {
  trackAbandonment: () => void
  recoverCart: (cartId: string) => Promise<void>
  abandonedCarts: AbandonedCart[]
  hasAbandonedCart: boolean
}

const AbandonedCartContext = createContext<
  AbandonedCartContextType | undefined
>(undefined)

const ABANDONMENT_DELAY = 30 * 60 * 1000 // 30 minutes
const RECOVERY_EMAIL_DELAYS = [
  1 * 60 * 60 * 1000, // 1 hour
  6 * 60 * 60 * 1000, // 6 hours
  24 * 60 * 60 * 1000, // 24 hours
]

export function AbandonedCartProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { cart, totalPrice } = useCart()
  const { data: session } = useSession()
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([])
  const abandonmentTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Track cart abandonment
  const trackAbandonment = useCallback(() => {
    if (cart.length === 0) return

    // Clear existing timer
    if (abandonmentTimerRef.current) {
      clearTimeout(abandonmentTimerRef.current)
      abandonmentTimerRef.current = null
    }

    // Set new timer
    const timer = setTimeout(async () => {
      try {
        // Check if user is still on checkout page
        if (window.location.pathname === '/checkout') {
          return
        }

        // Create abandoned cart record
        const abandonedCart: AbandonedCart = {
          id: `abandoned-${Date.now()}`,
          items: cart.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            sku: item.sku,
          })),
          totalPrice,
          abandonedAt: new Date().toISOString(),
          email: session?.user?.email,
          recoveryAttempts: 0,
          recovered: false,
        }

        // Save to localStorage
        const existing = JSON.parse(
          localStorage.getItem('heldeelife-abandoned-carts') || '[]'
        )
        existing.push(abandonedCart)
        localStorage.setItem(
          'heldeelife-abandoned-carts',
          JSON.stringify(existing)
        )

        setAbandonedCarts(existing)

        // Send to API for email recovery
        if (session?.user?.email) {
          await fetch('/api/cart/abandoned', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cart: abandonedCart,
              email: session.user.email,
            }),
          }).catch(console.error)
        }
      } catch (error) {
        console.error('Error tracking abandonment:', error)
      }
    }, ABANDONMENT_DELAY)

    abandonmentTimerRef.current = timer
  }, [cart, totalPrice, session])

  // Recover abandoned cart
  const recoverCart = useCallback(
    async (cartId: string) => {
      try {
        const cart = abandonedCarts.find((c) => c.id === cartId)
        if (!cart) return

        // Mark as recovered
        const updated = abandonedCarts.map((c) =>
          c.id === cartId ? { ...c, recovered: true } : c
        )
        setAbandonedCarts(updated)
        localStorage.setItem(
          'heldeelife-abandoned-carts',
          JSON.stringify(updated)
        )

        // Restore to cart (would need cart context method)
        // This would be handled by the recovery page/component
      } catch (error) {
        console.error('Error recovering cart:', error)
      }
    },
    [abandonedCarts]
  )

  // Load abandoned carts on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('heldeelife-abandoned-carts')
      if (saved) {
        const parsed = JSON.parse(saved)
        setAbandonedCarts(parsed.filter((c: AbandonedCart) => !c.recovered))
      }
    } catch (error) {
      console.error('Error loading abandoned carts:', error)
    }
  }, [])

  // Track abandonment when cart changes
  useEffect(() => {
    if (cart.length > 0) {
      trackAbandonment()
    }

    return () => {
      if (abandonmentTimerRef.current) {
        clearTimeout(abandonmentTimerRef.current)
        abandonmentTimerRef.current = null
      }
    }
  }, [cart, trackAbandonment])

  const value: AbandonedCartContextType = {
    trackAbandonment,
    recoverCart,
    abandonedCarts,
    hasAbandonedCart: abandonedCarts.length > 0,
  }

  return (
    <AbandonedCartContext.Provider value={value}>
      {children}
    </AbandonedCartContext.Provider>
  )
}

export function useAbandonedCart() {
  const context = useContext(AbandonedCartContext)
  if (context === undefined) {
    throw new Error(
      'useAbandonedCart must be used within an AbandonedCartProvider'
    )
  }
  return context
}

