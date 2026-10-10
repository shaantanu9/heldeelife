/**
 * POST /api/payments/create-order
 * Create (or reuse) the Razorpay order for one of our orders.
 *
 * Body: { order_id, access_token? } — access_token lets guests pay.
 * The amount always comes from the stored order, never from the client.
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
import {
  createRazorpayOrder,
  isPaymentGatewayConfigured,
} from '@/lib/commerce/razorpay'

export async function POST(request: NextRequest) {
  try {
    if (!isPaymentGatewayConfigured()) {
      return errorResponse(
        new ApiError(
          503,
          'Online payment is currently unavailable',
          'PAYMENT_CONFIG_ERROR'
        )
      )
    }

    const session = await getServerSession(authOptions)
    const body = await request.json().catch(() => ({}))
    const orderId: string | undefined = body?.order_id
    const accessToken: string | undefined = body?.access_token

    if (!orderId) {
      return errorResponse(
        new ApiError(400, 'Invalid payment request', 'VALIDATION_ERROR', {
          required: ['order_id'],
        })
      )
    }

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select(
        'id, user_id, order_number, status, payment_status, payment_method, payment_id, total_amount, customer_email'
      )
      .eq('id', orderId)
      .maybeSingle()

    if (!order || !canAccessOrder(order, session, accessToken)) {
      return errorResponse(
        new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND')
      )
    }
    if (order.payment_status === 'paid') {
      return errorResponse(
        new ApiError(400, 'Order already paid', 'ORDER_ALREADY_PAID')
      )
    }
    if (order.status !== 'pending') {
      return errorResponse(
        new ApiError(
          400,
          'This order can no longer be paid',
          'ORDER_NOT_PAYABLE'
        )
      )
    }

    const amountPaise = Math.round(Number(order.total_amount) * 100)
    const razorpayOrder = await createRazorpayOrder({
      amountPaise,
      receipt: order.order_number || order.id,
      notes: {
        order_id: order.id,
        order_number: order.order_number || '',
      },
    })

    // Remember which Razorpay order belongs to this order; verify() and the
    // webhook only accept payments for exactly this id.
    await supabaseAdmin
      .from('orders')
      .update({
        payment_id: razorpayOrder.id,
        payment_method: 'online',
        payment_status: 'pending',
      })
      .eq('id', order.id)

    return successResponse(
      {
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        order_id: order.id,
        order_number: order.order_number,
      },
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}
