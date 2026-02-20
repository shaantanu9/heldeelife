import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/cart/abandoned/route'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth-options', () => ({
  authOptions: {},
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true }),
  getRateLimitIdentifier: vi.fn().mockReturnValue('test-ip'),
}))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

describe('POST /api/cart/abandoned', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { supabaseAdmin } = await import('@/lib/supabase/server')
    supabaseAdmin.from.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'cart-123' },
        error: null,
      }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return 400 when cart and email are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/cart/abandoned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/Cart and email are required/)
  })

  it('should return 200 and cartId when valid body is sent', async () => {
    const request = new NextRequest('http://localhost:3000/api/cart/abandoned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart: { items: [], totalPrice: 0 },
        email: 'user@example.com',
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.cartId).toBe('cart-123')
  })
})
