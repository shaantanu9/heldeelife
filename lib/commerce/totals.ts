/**
 * Order totals — the ONE implementation shared by the cart page, checkout
 * page and the orders API, so what the shopper sees is exactly what the
 * server charges. The server always recomputes from database prices.
 */
import { BUSINESS_CONFIG } from '@/lib/constants'

export interface OrderTotals {
  subtotal: number
  discount: number
  shipping: number
  /** GST contained in (or added to) the price, for display & invoices */
  tax: number
  total: number
  freeShippingRemaining: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

export function computeOrderTotals(
  subtotal: number,
  discount = 0,
  config: {
    taxRate?: number
    pricesIncludeTax?: boolean
    freeShippingThreshold?: number
    shippingFee?: number
  } = {}
): OrderTotals {
  const {
    taxRate = BUSINESS_CONFIG.taxRate,
    pricesIncludeTax = BUSINESS_CONFIG.pricesIncludeTax,
    freeShippingThreshold = BUSINESS_CONFIG.freeShippingThreshold,
    shippingFee = BUSINESS_CONFIG.shippingFee,
  } = config

  const safeSubtotal = round2(Math.max(0, subtotal))
  const safeDiscount = round2(Math.min(Math.max(0, discount), safeSubtotal))
  const taxable = safeSubtotal - safeDiscount
  const shipping =
    safeSubtotal === 0 || safeSubtotal >= freeShippingThreshold
      ? 0
      : shippingFee
  const tax = pricesIncludeTax
    ? round2(taxable - taxable / (1 + taxRate))
    : round2(taxable * taxRate)
  const total = round2(taxable + shipping + (pricesIncludeTax ? 0 : tax))

  return {
    subtotal: safeSubtotal,
    discount: safeDiscount,
    shipping,
    tax,
    total,
    freeShippingRemaining: Math.max(
      0,
      round2(freeShippingThreshold - safeSubtotal)
    ),
  }
}
