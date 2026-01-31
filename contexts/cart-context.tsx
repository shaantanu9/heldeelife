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
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
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

  // Save cart to localStorage whenever it changes (only after hydration)
  // Use debouncing to avoid excessive writes
  useEffect(() => {
    if (isHydrated) {
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem('heldeelife-cart', JSON.stringify(cart))
        } catch (error) {
          console.error('Error saving cart:', error)
        }
      }, 300) // Debounce by 300ms

      return () => clearTimeout(timeoutId)
    }
  }, [cart, isHydrated])

  // Track cart abandonment when cart is not empty and user leaves
  useEffect(() => {
    if (!isHydrated || cart.length === 0) return

    // Track abandonment after 30 minutes of inactivity
    const abandonmentTimer = setTimeout(() => {
      if (cart.length > 0) {
        const cartValue = cart.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )
        AnalyticsTracker.trackCartAbandonment(cartValue, cart.length)
      }
    }, 30 * 60 * 1000) // 30 minutes

    return () => clearTimeout(abandonmentTimer)
  }, [cart, isHydrated])

  // Memoized cart functions to prevent unnecessary re-renders
  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id)
      const newCart = existingItem
        ? prevCart.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          )
        : [...prevCart, { ...item, quantity: 1 }]

      // Track analytics
      if (typeof window !== 'undefined') {
        const addedItem = newCart.find((cartItem) => cartItem.id === item.id)
        if (addedItem) {
          AnalyticsTracker.trackAddToCart(
            item.product_id,
            item.name,
            item.price,
            addedItem.quantity
          )
        }
      }

      return newCart
    })
  }, [])

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
      prevCart.map((item) => (item.id === id ? { ...item, quantity } : item))
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
