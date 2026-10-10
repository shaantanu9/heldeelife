import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createHmac } from 'crypto'
import { getServerSession } from 'next-auth'
import { computeOrderTotals } from '@/lib/commerce/totals'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth-options', () => ({ authOptions: {} }))
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(async () => ({ success: true, reset: Date.now() })),
  getRateLimitIdentifier: vi.fn(() => 'ip'),
}))

let existingOrder: any
const updates: any[] = []
vi.mock('@/lib/supabase/server', () => {
  const builder = () => {
    const q: any = {
      select: vi.fn(() => q),
      eq: vi.fn(() => q),
      neq: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn((data: any) => {
        updates.push(data)
        return q
      }),
      maybeSingle: vi.fn(() =>
        Promise.resolve({ data: existingOrder, error: null })
      ),
      single: vi.fn(() =>
        Promise.resolve({ data: { ...existingOrder }, error: null })
      ),
    }
    return q
  }
  return { supabaseAdmin: { from: vi.fn(builder) } }
})

describe('computeOrderTotals', () => {
  it('charges ₹50 shipping below ₹500 and none at or above', () => {
    expect(computeOrderTotals(499)).toMatchObject({ shipping: 50, total: 549 })
    expect(computeOrderTotals(500)).toMatchObject({ shipping: 0, total: 500 })
    expect(computeOrderTotals(0)).toMatchObject({ shipping: 0, total: 0 })
  })

  it('reports GST as included and never makes totals negative', () => {
    const t = computeOrderTotals(1180)
    expect(t.total).toBe(1180)
    expect(t.tax).toBe(180)
    expect(computeOrderTotals(100, 999)).toMatchObject({
      discount: 100,
      total: 50,
    })
  })
})

describe('PUT /api/orders/[id] (customer restrictions)', () => {
  beforeEach(() => {
    updates.length = 0
    existingOrder = {
      id: 'o1',
      user_id: 'u1',
      status: 'pending',
      payment_status: 'pending',
      payment_method: 'cod',
    }
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'u1', role: 'user' },
    })
  })

  const put = async (body: any) => {
    const { PUT } = await import('@/app/api/orders/[id]/route')
    return PUT(
      new NextRequest('http://localhost/api/orders/o1', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id: 'o1' }) }
    )
  }

  it('cannot mark their own order paid or delivered', async () => {
    for (const body of [
      { payment_status: 'paid' },
      { status: 'delivered' },
      { status: 'confirmed', payment_status: 'paid' },
    ]) {
      const res = await put(body)
      expect(res.status).toBe(403)
    }
    expect(updates).toHaveLength(0)
  })

  it('can cancel a pending unpaid order (only status/reason are written)', async () => {
    const res = await put({ status: 'cancelled', payment_status: 'paid' })
    expect(res.status).toBe(200)
    expect(updates[0]).toEqual({
      status: 'cancelled',
      cancelled_reason: 'Cancelled by customer',
    })
  })

  it('cannot cancel a paid order themselves', async () => {
    existingOrder.payment_status = 'paid'
    expect((await put({ status: 'cancelled' })).status).toBe(400)
  })

  it("cannot touch someone else's order", async () => {
    existingOrder.user_id = 'someone-else'
    expect((await put({ status: 'cancelled' })).status).toBe(404)
  })

  it('admins must follow valid status transitions', async () => {
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'a', role: 'admin' },
    })
    existingOrder.status = 'delivered'
    expect((await put({ status: 'pending' })).status).toBe(400)
    existingOrder.status = 'confirmed'
    expect((await put({ status: 'shipped' })).status).toBe(200)
  })
})

describe('POST /api/payments/verify', () => {
  const sign = (orderId: string, paymentId: string) =>
    createHmac('sha256', 'rzp-secret')
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

  beforeEach(() => {
    updates.length = 0
    process.env.RAZORPAY_KEY_SECRET = 'rzp-secret'
    process.env.NEXTAUTH_SECRET = 'test-secret'
    existingOrder = {
      id: 'o1',
      user_id: 'u1',
      status: 'pending',
      payment_status: 'pending',
      payment_id: 'order_RZP_EXPENSIVE',
    }
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'u1', role: 'user' },
    })
  })

  const verify = async (body: any) => {
    const { POST } = await import('@/app/api/payments/verify/route')
    return POST(
      new NextRequest('http://localhost/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    )
  }

  it('rejects a valid signature from a different Razorpay order', async () => {
    const res = await verify({
      order_id: 'o1',
      razorpay_order_id: 'order_RZP_CHEAP',
      razorpay_payment_id: 'pay_1',
      razorpay_signature: sign('order_RZP_CHEAP', 'pay_1'),
    })
    expect(res.status).toBe(400)
    expect(updates).toHaveLength(0)
  })

  it('rejects a forged signature', async () => {
    const res = await verify({
      order_id: 'o1',
      razorpay_order_id: 'order_RZP_EXPENSIVE',
      razorpay_payment_id: 'pay_1',
      razorpay_signature: 'deadbeef',
    })
    expect(res.status).toBe(400)
  })

  it('marks the matching order paid and confirmed', async () => {
    const res = await verify({
      order_id: 'o1',
      razorpay_order_id: 'order_RZP_EXPENSIVE',
      razorpay_payment_id: 'pay_1',
      razorpay_signature: sign('order_RZP_EXPENSIVE', 'pay_1'),
    })
    expect(res.status).toBe(200)
    expect(updates[0]).toMatchObject({
      payment_status: 'paid',
      payment_transaction_id: 'pay_1',
      status: 'confirmed',
    })
  })

  it('lets a guest verify with the order access token', async () => {
    ;(getServerSession as any).mockResolvedValue(null)
    existingOrder.user_id = null
    const { createOrderAccessToken } =
      await import('@/lib/commerce/order-access')
    const body = {
      order_id: 'o1',
      razorpay_order_id: 'order_RZP_EXPENSIVE',
      razorpay_payment_id: 'pay_2',
      razorpay_signature: sign('order_RZP_EXPENSIVE', 'pay_2'),
    }
    expect((await verify(body)).status).toBe(404)
    expect(
      (await verify({ ...body, access_token: createOrderAccessToken('o1') }))
        .status
    ).toBe(200)
  })
})
