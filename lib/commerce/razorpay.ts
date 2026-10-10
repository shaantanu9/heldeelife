/**
 * Razorpay helpers (REST API via fetch — no SDK dependency).
 */
import { createHmac, timingSafeEqual } from 'crypto'

const RAZORPAY_BASE_URL = 'https://api.razorpay.com/v1'

export function isPaymentGatewayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

/** Checkout handler signature: HMAC_SHA256(order_id|payment_id, key_secret) */
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret || !signature) return false
  const expected = createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')
  return safeEqualHex(expected, signature)
}

/** Webhook signature: HMAC_SHA256(raw body, webhook secret) */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  return safeEqualHex(expected, signature)
}

export async function createRazorpayOrder(params: {
  amountPaise: number
  receipt: string
  notes: Record<string, string>
}): Promise<{ id: string; amount: number; currency: string }> {
  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString('base64')

  const response = await fetch(`${RAZORPAY_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: 'INR',
      receipt: params.receipt.slice(0, 40),
      notes: params.notes,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Razorpay order creation failed (${response.status}): ${detail}`)
  }
  return response.json()
}
