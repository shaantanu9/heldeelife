/**
 * POST /api/payments/webhook
 * Razorpay webhook handler for payment events
 * This endpoint should be publicly accessible (no auth required)
 * but should verify webhook signature
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import crypto from 'crypto'
import {
  errorResponse,
  successResponse,
  handleApiError,
  ApiError,
} from '@/lib/utils/api-error'

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    return false
  }

  const generatedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')

  return generatedSignature === signature
}

export async function POST(request: NextRequest) {
  try {
    // Get webhook signature from headers
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return errorResponse(
        new ApiError(401, 'Missing webhook signature', 'MISSING_SIGNATURE')
      )
    }

    // Get raw body for signature verification
    const body = await request.text()

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return errorResponse(
        new ApiError(401, 'Invalid webhook signature', 'INVALID_SIGNATURE')
      )
    }

    const event = JSON.parse(body)

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload)
        break

      case 'payment.failed':
        await handlePaymentFailed(event.payload)
        break

      case 'order.paid':
        await handleOrderPaid(event.payload)
        break

      default:
        console.log('Unhandled webhook event:', event.event)
    }

    return successResponse({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return handleApiError(error)
  }
}

/**
 * Handle payment captured event
 */
async function handlePaymentCaptured(payload: any) {
  const payment = payload.payment.entity
  const order = payload.order.entity

  // Find order by payment_id
  const { data: dbOrder } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('payment_id', order.id)
    .single()

  if (dbOrder && payment.status === 'captured') {
    await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
      })
      .eq('id', dbOrder.id)

    // Reserve inventory
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', dbOrder.id)

    if (orderItems) {
      for (const item of orderItems) {
        if (item.product_id) {
          const { data: inventory } = await supabaseAdmin
            .from('inventory')
            .select('id, reserved_quantity')
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
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(payload: any) {
  const payment = payload.payment.entity
  const order = payload.order.entity

  const { data: dbOrder } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('payment_id', order.id)
    .single()

  if (dbOrder) {
    await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'failed',
      })
      .eq('id', dbOrder.id)
  }
}

/**
 * Handle order paid event
 */
async function handleOrderPaid(payload: any) {
  // Similar to payment captured
  await handlePaymentCaptured(payload)
}

// Disable body parsing for webhook to get raw body
export const runtime = 'nodejs'
