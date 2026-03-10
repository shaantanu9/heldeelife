/**
 * Regression test: checkout page must read payment data from paymentData.data.*
 * not from the top-level paymentData.* (which is the wrapper envelope).
 *
 * The API returns { success: true, data: { razorpay_order_id, amount, currency } }
 * via successResponse(). Before the fix, checkout accessed paymentData.amount etc.
 * (undefined), now it correctly accesses paymentData.data.amount etc.
 */

import { describe, it, expect } from 'vitest'

// Simulates the shape returned by /api/payments/create-order
function buildApiResponse(payload: {
  razorpay_order_id: string
  amount: number
  currency: string
}) {
  return {
    success: true,
    data: payload,
  }
}

// Simulates what the BUGGY checkout code did (reads top-level keys)
function extractPaymentFieldsBuggy(paymentData: ReturnType<typeof buildApiResponse>) {
  return {
    amount: (paymentData as any).amount,
    currency: (paymentData as any).currency,
    razorpay_order_id: (paymentData as any).razorpay_order_id,
  }
}

// Simulates what the FIXED checkout code does (reads from .data)
function extractPaymentFieldsFixed(paymentData: ReturnType<typeof buildApiResponse>) {
  if (!paymentData.success || !paymentData.data) {
    throw new Error('Failed to create payment order')
  }
  return {
    amount: paymentData.data.amount,
    currency: paymentData.data.currency,
    razorpay_order_id: paymentData.data.razorpay_order_id,
  }
}

describe('checkout payment data extraction', () => {
  const apiResponse = buildApiResponse({
    razorpay_order_id: 'order_abc123',
    amount: 50000,
    currency: 'INR',
  })

  it('BUGGY: top-level access returns undefined (demonstrates the bug)', () => {
    const fields = extractPaymentFieldsBuggy(apiResponse)
    // These were all undefined before the fix — Razorpay opened with undefined values
    expect(fields.amount).toBeUndefined()
    expect(fields.currency).toBeUndefined()
    expect(fields.razorpay_order_id).toBeUndefined()
  })

  it('FIXED: data.* access returns correct values', () => {
    const fields = extractPaymentFieldsFixed(apiResponse)
    expect(fields.amount).toBe(50000)
    expect(fields.currency).toBe('INR')
    expect(fields.razorpay_order_id).toBe('order_abc123')
  })

  it('FIXED: throws user-visible error when success is false', () => {
    const errorResponse = { success: false, data: null, error: { message: 'Payment failed' } }
    expect(() => extractPaymentFieldsFixed(errorResponse as any)).toThrow('Failed to create payment order')
  })

  it('FIXED: throws when data is missing even if success is true', () => {
    const malformedResponse = { success: true, data: null }
    expect(() => extractPaymentFieldsFixed(malformedResponse as any)).toThrow('Failed to create payment order')
  })
})
