/**
 * POST /api/payments/verify
 * Verify the Razorpay checkout signature and mark the order paid.
 *
 * Body: { order_id, razorpay_order_id, razorpay_payment_id,
 *         razorpay_signature, access_token? }
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  errorResponse,
  successResponse,
  handleApiError,
  ApiError,
} from '@/lib/utils/api-error'
import { canAccessOrder } from '@/lib/commerce/order-access'
import { verifyPaymentSignature } from '@/lib/commerce/razorpay'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return errorResponse(
        new ApiError(
          503,
          'Payment gateway not configured',
          'PAYMENT_CONFIG_ERROR'
        )
      )
    }

    const session = await getServerSession(authOptions)
    const body = await request.json().catch(() => ({}))
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      access_token,
    } = body ?? {}

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

    if (
      !verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      )
    ) {
      return errorResponse(
        new ApiError(400, 'Invalid payment signature', 'INVALID_SIGNATURE')
      )
    }

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select(
        'id, user_id, status, payment_status, payment_id, payment_transaction_id'
      )
      .eq('id', order_id)
      .maybeSingle()

    if (!order || !canAccessOrder(order, session, access_token)) {
      return errorResponse(
        new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND')
      )
    }

    // The signature only proves *a* payment happened; it must be for the
    // Razorpay order we created for THIS order (otherwise a cheap order's
    // payment could mark an expensive one paid).
    if (order.payment_id !== razorpay_order_id) {
      return errorResponse(
        new ApiError(
          400,
          'Payment does not match this order',
          'PAYMENT_MISMATCH'
        )
      )
    }

    // Idempotent: the webhook may have confirmed it already
    if (order.payment_status === 'paid') {
      return successResponse({ order_id: order.id, payment_status: 'paid' })
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        payment_transaction_id: razorpay_payment_id,
        // A cancelled (e.g. expired) order that got paid stays cancelled so
        // support can refund it; normal orders are confirmed.
        ...(order.status === 'pending' && { status: 'confirmed' }),
      })
      .eq('id', order.id)
      .neq('payment_status', 'paid')

    if (updateError) {
      console.error('Error updating order after payment:', updateError)
      return errorResponse(
        new ApiError(500, 'Failed to update order', 'ORDER_UPDATE_FAILED')
      )
    }

    return successResponse({ order_id: order.id, payment_status: 'paid' })
  } catch (error) {
    return handleApiError(error)
  }
}
