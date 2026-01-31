'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCart } from '@/contexts/cart-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Minus, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { EmptyState } from '@/components/mobile/empty-states'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  CartSocialProof,
  CartTrustBadges,
  CartUrgencyIndicator,
  CartSavingsDisplay,
  CartRecentActivity,
  CartFreeShippingProgress,
} from '@/components/conversion/cart-enhancements'
import { CartAbandonmentBanner } from '@/components/conversion/cart-abandonment-banner'

interface CartItemWithAvailability {
  id: string
  product_id: string
  name: string
  price: number
  image: string
  quantity: number
  sku?: string
  available?: boolean
  availableQuantity?: number
  isActive?: boolean
}

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, totalPrice, totalItems } =
    useCart()
  const [cartItemsWithAvailability, setCartItemsWithAvailability] = useState<
    CartItemWithAvailability[]
  >([])
  const [isValidating, setIsValidating] = useState(true)

  // Calculate psychological triggers
  const lowStockItems = useMemo(() => {
    return cartItemsWithAvailability.filter(
      (item) =>
        item.availableQuantity !== undefined &&
        item.availableQuantity > 0 &&
        item.availableQuantity <= 10 &&
        item.availableQuantity >= item.quantity
    ).length
  }, [cartItemsWithAvailability])

  const originalTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  // Validate cart items availability
  useEffect(() => {
    const validateCartItems = async () => {
      if (cart.length === 0) {
        setCartItemsWithAvailability([])
        setIsValidating(false)
        return
      }

      setIsValidating(true)
      try {
        const validatedItems = await Promise.all(
          cart.map(async (item) => {
            try {
              const response = await fetch(
                `/api/products/${item.product_id || item.id}`
              )
              if (response.ok) {
                const data = await response.json()
                const product = data.product
                return {
                  ...item,
                  available: product.inStock,
                  availableQuantity: product.stockQuantity || 0,
                  isActive: product.is_active !== false,
                }
              }
              return {
                ...item,
                available: false,
                availableQuantity: 0,
                isActive: false,
              }
            } catch (error) {
              console.error(`Error validating product ${item.id}:`, error)
              return {
                ...item,
                available: false,
                availableQuantity: 0,
                isActive: false,
              }
            }
          })
        )

        setCartItemsWithAvailability(validatedItems)

        // Check for issues and notify user
        const unavailableItems = validatedItems.filter(
          (item) =>
            !item.available ||
            !item.isActive ||
            (item.availableQuantity || 0) < item.quantity
        )

        if (unavailableItems.length > 0) {
          unavailableItems.forEach((item) => {
            if (!item.isActive) {
              toast.error(`${item.name} is no longer available`, {
                description: 'This item has been removed from our catalog',
                action: {
                  label: 'Remove',
                  onClick: () => removeFromCart(item.id),
                },
              })
            } else if ((item.availableQuantity || 0) < item.quantity) {
              toast.warning(`Limited stock for ${item.name}`, {
                description: `Only ${item.availableQuantity} available. Please update quantity.`,
              })
            }
          })
        }
      } catch (error) {
        console.error('Error validating cart:', error)
      } finally {
        setIsValidating(false)
      }
    }

    validateCartItems()
  }, [cart, removeFromCart])

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-24">
        <div className="container px-4">
          <EmptyState type="cart" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Shopping <span className="text-orange-600">Cart</span>
        </h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            {/* Cart Abandonment Banner - Urgency after 2 minutes */}
            {!isValidating && cart.length > 0 && (
              <CartAbandonmentBanner />
            )}

            {/* Psychological Triggers - Social Proof & Trust */}
            {!isValidating && cart.length > 0 && (
              <>
                <CartSocialProof />
                <CartUrgencyIndicator lowStockItems={lowStockItems} />
                <CartRecentActivity />
              </>
            )}

            {isValidating && cart.length > 0 && (
              <Card className="border border-gray-200 shadow-md bg-white">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600">Validating cart items...</p>
                </CardContent>
              </Card>
            )}
            {(isValidating ? cart : cartItemsWithAvailability).map((item) => {
              const cartItem =
                cartItemsWithAvailability.find((ci) => ci.id === item.id) ||
                item
              const isUnavailable = !cartItem.available || !cartItem.isActive
              const isLowStock =
                cartItem.availableQuantity !== undefined &&
                cartItem.availableQuantity < cartItem.quantity &&
                cartItem.availableQuantity > 0
              const isOutOfStock = cartItem.availableQuantity === 0

              return (
                <Card
                  key={item.id}
                  className={`border ${
                    isUnavailable
                      ? 'border-red-200 bg-red-50'
                      : isLowStock
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-gray-200'
                  } shadow-md bg-white`}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Link
                        href={`/products/${item.product_id || item.id}`}
                        className="flex-shrink-0"
                      >
                        <div className="w-24 h-24 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-orange-100 transition-colors cursor-pointer">
                          <span className="text-4xl">{item.image}</span>
                        </div>
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <Link
                            href={`/products/${item.product_id || item.id}`}
                          >
                            <h3 className="font-semibold text-lg text-gray-900 hover:text-orange-600 transition-colors">
                              {item.name}
                            </h3>
                          </Link>
                          {isUnavailable && (
                            <Badge variant="destructive" className="ml-2">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Unavailable
                            </Badge>
                          )}
                          {isLowStock && !isUnavailable && (
                            <Badge
                              variant="outline"
                              className="ml-2 border-yellow-500 text-yellow-700"
                            >
                              Low Stock
                            </Badge>
                          )}
                        </div>
                        {item.sku && (
                          <p className="text-xs text-gray-500 mb-2">
                            SKU: {item.sku}
                          </p>
                        )}
                        {isLowStock && !isUnavailable && (
                          <p className="text-xs text-yellow-700 mb-2">
                            Only {cartItem.availableQuantity} available
                          </p>
                        )}
                        {isOutOfStock && (
                          <p className="text-xs text-red-700 mb-2">
                            Out of stock
                          </p>
                        )}
                        <p className="text-orange-600 font-bold text-xl mb-4">
                          Rs. {item.price.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-orange-50 hover:text-orange-600"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              disabled={isUnavailable}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-orange-50 hover:text-orange-600"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              disabled={
                                isUnavailable ||
                                (cartItem.availableQuantity !== undefined &&
                                  item.quantity >= cartItem.availableQuantity)
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-gray-900">
                          Rs. {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <Card className="border border-gray-200 shadow-xl bg-white sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Order Summary
                </h2>

                {/* Trust Badges - Build Confidence */}
                {!isValidating && (
                  <div className="mb-6">
                    <CartTrustBadges />
                  </div>
                )}

                {/* Free Shipping Progress - Reciprocity */}
                {!isValidating && (
                  <div className="mb-6">
                    <CartFreeShippingProgress
                      currentTotal={totalPrice}
                      threshold={500}
                    />
                  </div>
                )}

                {/* Savings Display - Value Perception */}
                {!isValidating && originalTotal > totalPrice && (
                  <div className="mb-6">
                    <CartSavingsDisplay
                      originalTotal={originalTotal}
                      currentTotal={totalPrice}
                    />
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>Rs. {totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4 flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-orange-600">
                      Rs. {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button
                  className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 mb-4"
                  size="lg"
                  asChild
                  disabled={
                    cart.length === 0 ||
                    isValidating ||
                    cartItemsWithAvailability.some(
                      (item) =>
                        !item.available ||
                        !item.isActive ||
                        (item.availableQuantity || 0) < item.quantity
                    )
                  }
                >
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
                {!isValidating &&
                  cartItemsWithAvailability.some(
                    (item) =>
                      !item.available ||
                      !item.isActive ||
                      (item.availableQuantity || 0) < item.quantity
                  ) && (
                    <p className="text-xs text-red-600 text-center mb-2">
                      Please resolve cart issues before checkout
                    </p>
                  )}
                <Button variant="outline" asChild className="w-full rounded-lg">
                  <Link href="/shop">Continue Shopping</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
