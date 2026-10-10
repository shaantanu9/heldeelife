import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderHook, act } from '@testing-library/react'
import {
  CartProvider,
  useCart,
  clampCartQuantity,
} from '@/contexts/cart-context'

vi.mock('@/lib/analytics/tracking', () => ({
  AnalyticsTracker: {
    trackAddToCart: vi.fn(),
    trackRemoveFromCart: vi.fn(),
    trackCartAbandonment: vi.fn(),
  },
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
)

const baseItem = {
  id: 'p1',
  product_id: 'p1',
  name: 'Tulsi Drops',
  price: 100,
  image: '📦',
}

describe('clampCartQuantity', () => {
  it('caps at a positive maxQuantity', () => {
    expect(clampCartQuantity(7, 5)).toBe(5)
    expect(clampCartQuantity(3, 5)).toBe(3)
  })

  it('ignores missing, zero or invalid caps', () => {
    expect(clampCartQuantity(7)).toBe(7)
    expect(clampCartQuantity(7, 0)).toBe(7)
    expect(clampCartQuantity(7, Number.NaN)).toBe(7)
  })
})

describe('CartProvider quantity clamping', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('adds 1 by default (backward compatible)', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addToCart(baseItem))
    act(() => result.current.addToCart(baseItem))
    expect(result.current.cart).toHaveLength(1)
    expect(result.current.cart[0].quantity).toBe(2)
    expect(result.current.totalItems).toBe(2)
  })

  it('adds an explicit quantity in a single call', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addToCart(baseItem, 3))
    expect(result.current.cart[0].quantity).toBe(3)
    expect(result.current.totalPrice).toBe(300)
  })

  it('clamps addToCart to maxQuantity, including repeat adds', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addToCart({ ...baseItem, maxQuantity: 4 }, 3))
    act(() => result.current.addToCart({ ...baseItem, maxQuantity: 4 }, 3))
    expect(result.current.cart[0].quantity).toBe(4)

    // A later add without stock info keeps the stored cap
    act(() => result.current.addToCart(baseItem))
    expect(result.current.cart[0].quantity).toBe(4)
  })

  it('clamps updateQuantity to the stored maxQuantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addToCart({ ...baseItem, maxQuantity: 5 }))
    act(() => result.current.updateQuantity('p1', 10))
    expect(result.current.cart[0].quantity).toBe(5)
    act(() => result.current.updateQuantity('p1', 2))
    expect(result.current.cart[0].quantity).toBe(2)
  })

  it('does not cap items without maxQuantity and removes on 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addToCart(baseItem))
    act(() => result.current.updateQuantity('p1', 50))
    expect(result.current.cart[0].quantity).toBe(50)
    act(() => result.current.updateQuantity('p1', 0))
    expect(result.current.cart).toHaveLength(0)
  })

  it('treats an invalid quantity argument as 1', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addToCart(baseItem, 0))
    act(() => result.current.addToCart(baseItem, Number.NaN))
    expect(result.current.cart[0].quantity).toBe(2)
  })
})
