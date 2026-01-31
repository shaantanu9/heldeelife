/**
 * POST /api/payments/create-order
 * Create a payment order with Razorpay
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  errorResponse,
  successResponse,
  handleApiError,
  ApiError,
} from '@/lib/utils/api-error'

// Razorpay SDK (install: npm install razorpay)
// For now, we'll use fetch API to call Razorpay API directly
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
const RAZORPAY_BASE_URL = 'https://api.razorpay.com/v1'

interface CreatePaymentOrderRequest {
  order_id: string // Our internal order ID
  amount: number // Amount in paise (smallest currency unit)
  currency?: string
  receipt?: string
  notes?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return errorResponse(new ApiError(401, 'Unauthorized', 'UNAUTHORIZED'))
    }

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return errorResponse(
        new ApiError(
          500,
          'Payment gateway not configured',
          'PAYMENT_CONFIG_ERROR'
        )
      )
    }

    const body: CreatePaymentOrderRequest = await request.json()
    const { order_id, amount, currency = 'INR', receipt, notes } = body

    // Validate required fields
    if (!order_id || !amount || amount <= 0) {
      return errorResponse(
        new ApiError(400, 'Invalid payment request', 'VALIDATION_ERROR', {
          required: ['order_id', 'amount'],
        })
      )
    }

    // Verify order exists and belongs to user
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', session.user.id)
      .single()

    if (orderError || !order) {
      return errorResponse(
        new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND')
      )
    }

    // Check if order is already paid
    if (order.payment_status === 'paid') {
      return errorResponse(
        new ApiError(400, 'Order already paid', 'ORDER_ALREADY_PAID')
      )
    }

    // Create Razorpay order
    const razorpayOrderData = {
      amount: Math.round(amount), // Amount in paise
      currency: currency,
      receipt: receipt || order.order_number,
      notes: {
        order_id: order.id,
        order_number: order.order_number,
        user_id: session.user.id,
        ...notes,
      },
    }

    const razorpayResponse = await fetch(`${RAZORPAY_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
      },
      body: JSON.stringify(razorpayOrderData),
    })

    if (!razorpayResponse.ok) {
      const error = await razorpayResponse.json()
      console.error('Razorpay error:', error)
      return errorResponse(
        new ApiError(
          500,
          'Failed to create payment order',
          'PAYMENT_ORDER_FAILED',
          error
        )
      )
    }

    const razorpayOrder = await razorpayResponse.json()

    // Update order with payment ID
    await supabaseAdmin
      .from('orders')
      .update({
        payment_id: razorpayOrder.id,
        payment_method: 'online',
      })
      .eq('id', order_id)

    return successResponse(
      {
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: RAZORPAY_KEY_ID,
        order_id: order_id,
      },
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}









