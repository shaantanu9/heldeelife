/**
 * POST /api/payments/webhook
 * Razorpay webhook (public, signature-verified).
 *
 * Safety net for when the customer closes the tab before /verify runs.
 * Handlers are idempotent; stock is never touched here — reservations are
 * made by place_order() and moved by the order-status trigger.
 *
 * Requires RAZORPAY_WEBHOOK_SECRET (Razorpay Dashboard → Webhooks).
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  errorResponse,
  successResponse,
  handleApiError,
  ApiError,
} from '@/lib/utils/api-error'
import { verifyWebhookSignature } from '@/lib/commerce/razorpay'

interface PaymentEntity {
  id: string
  order_id?: string
  status?: string
  notes?: Record<string, string>
}

async function findOrder(razorpayOrderId?: string, internalId?: string) {
  if (razorpayOrderId) {
    const { data } = await supabaseAdmin
      .from('orders')
      .select('id, status, payment_status')
      .eq('payment_id', razorpayOrderId)
      .maybeSingle()
    if (data) return data
  }
  if (internalId) {
    const { data } = await supabaseAdmin
      .from('orders')
      .select('id, status, payment_status')
      .eq('id', internalId)
      .maybeSingle()
    if (data) return data
  }
  return null
}

async function markPaid(payment: PaymentEntity, internalOrderId?: string) {
  const order = await findOrder(payment.order_id, internalOrderId)
  if (!order) {
    console.warn('Webhook: no order for payment', payment.id, payment.order_id)
    return
  }
  if (order.payment_status === 'paid') return

  await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'paid',
      payment_transaction_id: payment.id,
      ...(order.status === 'pending' && { status: 'confirmed' }),
    })
    .eq('id', order.id)
    .neq('payment_status', 'paid')
}

async function markFailed(payment: PaymentEntity) {
  const order = await findOrder(payment.order_id, payment.notes?.order_id)
  if (!order || order.payment_status === 'paid') return
  // Keep the order pending so the customer can retry; stale unpaid orders
  // are cancelled (and their stock released) by expire_stale_online_orders().
  await supabaseAdmin
    .from('orders')
    .update({ payment_status: 'failed' })
    .eq('id', order.id)
    .neq('payment_status', 'paid')
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    if (
      !verifyWebhookSignature(
        rawBody,
        request.headers.get('x-razorpay-signature')
      )
    ) {
      return errorResponse(
        new ApiError(401, 'Invalid webhook signature', 'INVALID_SIGNATURE')
      )
    }

    const event = JSON.parse(rawBody)
    const payment: PaymentEntity | undefined = event?.payload?.payment?.entity

    switch (event?.event) {
      case 'payment.captured':
        if (payment) await markPaid(payment, payment.notes?.order_id)
        break
      case 'order.paid':
        if (payment) {
          await markPaid(
            payment,
            event?.payload?.order?.entity?.notes?.order_id
          )
        }
        break
      case 'payment.failed':
        if (payment) await markFailed(payment)
        break
      default:
        // Acknowledge unhandled events so Razorpay doesn't retry them
        break
    }

    return successResponse({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return handleApiError(error)
  }
}
