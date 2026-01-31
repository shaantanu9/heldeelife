/**
 * POST /api/payments/verify
 * Verify Razorpay payment signature
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import crypto from 'crypto'
import {
  errorResponse,
  successResponse,
  handleApiError,
  ApiError,
} from '@/lib/utils/api-error'

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

interface VerifyPaymentRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  order_id: string // Our internal order ID
}

/**
 * Verify Razorpay payment signature
 */
function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!RAZORPAY_KEY_SECRET) {
    return false
  }

  const payload = `${orderId}|${paymentId}`
  const generatedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest('hex')

  return generatedSignature === signature
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return errorResponse(new ApiError(401, 'Unauthorized', 'UNAUTHORIZED'))
    }

    if (!RAZORPAY_KEY_SECRET) {
      return errorResponse(
        new ApiError(
          500,
          'Payment gateway not configured',
          'PAYMENT_CONFIG_ERROR'
        )
      )
    }

    const body: VerifyPaymentRequest = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    } = body

    // Validate required fields
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !order_id
    ) {
      return errorResponse(
        new ApiError(
          400,
          'Missing payment verification data',
          'VALIDATION_ERROR'
        )
      )
    }

    // Verify signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!isValid) {
      return errorResponse(
        new ApiError(400, 'Invalid payment signature', 'INVALID_SIGNATURE')
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

    // Update order payment status
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        payment_id: razorpay_payment_id,
        status: 'confirmed',
      })
      .eq('id', order_id)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return errorResponse(
        new ApiError(500, 'Failed to update order', 'UPDATE_FAILED')
      )
    }

    // Reserve inventory for confirmed order
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', order_id)

    if (orderItems) {
      for (const item of orderItems) {
        if (item.product_id) {
          const { data: inventory } = await supabaseAdmin
            .from('inventory')
            .select('id, quantity, reserved_quantity')
            .eq('product_id', item.product_id)
            .single()

          if (inventory) {
            await supabaseAdmin
              .from('inventory')
              .update({
                reserved_quantity:
                  (inventory.reserved_quantity || 0) + item.quantity,
              })
              .eq('id', inventory.id)
          }
        }
      }
    }

    return successResponse({
      verified: true,
      order_id: order_id,
      payment_id: razorpay_payment_id,
      message: 'Payment verified successfully',
    })
  } catch (error) {
    return handleApiError(error)
  }
}









