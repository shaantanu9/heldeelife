'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import { AnalyticsTracker } from '@/lib/analytics/tracking'

export interface CartItem {
  id: string
  product_id: string // Product ID from database
  name: string
  price: number
  image: string
  quantity: number
  sku?: string // Product SKU from database
  /** Optional stock cap (e.g. inventory available_quantity). */
  maxQuantity?: number
}

/**
 * Clamp a quantity to an item's stock cap. Only a positive, finite
 * `maxQuantity` is treated as a cap; missing/zero/invalid values mean the
 * stock level is unknown, so the quantity is left as-is (server validates).
 */
export function clampCartQuantity(
  quantity: number,
  maxQuantity?: number
): number {
  if (
    typeof maxQuantity === 'number' &&
    Number.isFinite(maxQuantity) &&
    maxQuantity > 0
  ) {
    return Math.min(quantity, Math.floor(maxQuantity))
  }
  return quantity
}

interface CartContextType {
  cart: CartItem[]
  /**
   * Add `quantity` (default 1) of an item. If it is already in the cart the
   * quantities are summed. The result is clamped to `maxQuantity` when known.
   */
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

// Helper type for adding items to cart (product_id is required)
export type AddToCartItem = Omit<CartItem, 'quantity'> & {
  product_id: string
  sku?: string
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cart from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('heldeelife-cart')
      if (savedCart) {
        const parsed = JSON.parse(savedCart)
        // Validate cart structure
        if (Array.isArray(parsed)) {
          setCart(parsed)
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error)
      // Clear corrupted cart data
      localStorage.removeItem('heldeelife-cart')
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // Persist immediately on every change (only after hydration). Debouncing
  // here lost items when shoppers added to cart and navigated/refreshed
  // within the debounce window; a localStorage write of a cart is cheap.
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem('heldeelife-cart', JSON.stringify(cart))
    } catch (error) {
      console.error('Error saving cart:', error)
    }
  }, [cart, isHydrated])

  // Track cart abandonment when cart is not empty and user leaves
  useEffect(() => {
    if (!isHydrated || cart.length === 0) return

    // Track abandonment after 30 minutes of inactivity
    const abandonmentTimer = setTimeout(
      () => {
        if (cart.length > 0) {
          const cartValue = cart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          )
          AnalyticsTracker.trackCartAbandonment(cartValue, cart.length)
        }
      },
      30 * 60 * 1000
    ) // 30 minutes

    return () => clearTimeout(abandonmentTimer)
  }, [cart, isHydrated])

  // Memoized cart functions to prevent unnecessary re-renders
  const addToCart = useCallback(
    (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
      const amount =
        Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : 1

      setCart((prevCart) => {
        const existingItem = prevCart.find(
          (cartItem) => cartItem.id === item.id
        )
        const maxQuantity = item.maxQuantity ?? existingItem?.maxQuantity
        const nextQuantity = clampCartQuantity(
          (existingItem?.quantity ?? 0) + amount,
          maxQuantity
        )

        if (existingItem && nextQuantity === existingItem.quantity) {
          // Already at the stock cap: nothing changes
          return prevCart
        }

        const newCart = existingItem
          ? prevCart.map((cartItem) =>
              cartItem.id === item.id
                ? {
                    ...cartItem,
                    maxQuantity,
                    quantity: nextQuantity,
                  }
                : cartItem
            )
          : [...prevCart, { ...item, maxQuantity, quantity: nextQuantity }]

        // Track analytics
        if (typeof window !== 'undefined') {
          AnalyticsTracker.trackAddToCart(
            item.product_id,
            item.name,
            item.price,
            nextQuantity
          )
        }

        return newCart
      })
    },
    []
  )

  const removeFromCart = useCallback((id: string) => {
    setCart((prevCart) => {
      const removedItem = prevCart.find((item) => item.id === id)
      if (removedItem && typeof window !== 'undefined') {
        AnalyticsTracker.trackRemoveFromCart(
          removedItem.product_id,
          removedItem.name,
          removedItem.price
        )
      }
      return prevCart.filter((item) => item.id !== id)
    })
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prevCart) => prevCart.filter((item) => item.id !== id))
      return
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: clampCartQuantity(
                Math.max(1, Math.floor(quantity)),
                item.maxQuantity
              ),
            }
          : item
      )
    )
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  // Memoize computed values to prevent recalculation on every render
  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  )

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  )

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
    }),
    [
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
    ]
  )

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
