/**
 * Pricing Utilities
 * Research-backed pricing strategies for conversion optimization
 *
 * Key Findings:
 * - Charm pricing ($19.99 vs $20) increases conversions by 2-5%
 * - Displaying savings amount increases perceived value
 * - Price anchoring (compare at price) increases conversions
 */

/**
 * Apply charm pricing (ending in .99)
 * Research shows this increases conversions by 2-5%
 */
export function applyCharmPricing(price: number): number {
  // Round to nearest .99
  const rounded = Math.floor(price)
  return rounded + 0.99
}

/**
 * Format price with charm pricing
 * Shows $19.99 instead of $20.00
 */
export function formatCharmPrice(price: number): string {
  const charmPrice = applyCharmPricing(price)
  return `Rs. ${charmPrice.toFixed(2)}`
}

/**
 * Calculate and format savings
 * Research shows displaying savings increases perceived value
 */
export function calculateSavings(
  originalPrice: number,
  currentPrice: number
): {
  amount: number
  percentage: number
  formatted: string
} {
  const amount = originalPrice - currentPrice
  const percentage = Math.round((amount / originalPrice) * 100)

  return {
    amount,
    percentage,
    formatted: `Save Rs. ${amount.toFixed(2)} (${percentage}% off)`,
  }
}

/**
 * Format price with Indian number formatting
 */
// Charm pricing is opt-in only: displaying ₹149.99 for a product that is
// charged at ₹149 misstates the price.
export function formatPrice(price: number, useCharmPricing = false): string {
  const finalPrice = useCharmPricing ? applyCharmPricing(price) : price
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(finalPrice)
}

/**
 * Get price display with compare at price
 * Price anchoring increases conversions
 */
export function getPriceDisplay(
  price: number,
  compareAtPrice?: number
): {
  current: string
  original?: string
  savings?: string
  discount?: number
} {
  const current = formatPrice(price)

  if (!compareAtPrice || compareAtPrice <= price) {
    return { current }
  }

  const savings = calculateSavings(compareAtPrice, price)
  const original = formatPrice(compareAtPrice, false)

  return {
    current,
    original,
    savings: savings.formatted,
    discount: savings.percentage,
  }
}

/**
 * Check if free shipping threshold is met
 * Research shows free shipping reduces abandonment by 30%
 */
export function checkFreeShipping(
  cartTotal: number,
  threshold: number = 500
): {
  eligible: boolean
  remaining: number
  message: string
} {
  const eligible = cartTotal >= threshold
  const remaining = Math.max(0, threshold - cartTotal)

  return {
    eligible,
    remaining,
    message: eligible
      ? '🎉 You qualify for free shipping!'
      : `Add Rs. ${remaining.toFixed(2)} more for free shipping`,
  }
}









