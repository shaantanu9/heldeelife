import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/orders/route'
import { getServerSession } from 'next-auth'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock Supabase - create mock client inside factory
vi.mock('@/lib/supabase/server', () => {
  const mockFrom = vi.fn()
  return {
    supabaseAdmin: {
      from: mockFrom,
    },
  }
})

// Mock auth-options
vi.mock('@/lib/auth-options', () => ({
  authOptions: {},
}))

// Mock cache headers
vi.mock('@/lib/utils/cache-headers', () => ({
  createCachedResponse: vi.fn((data, options) => {
    const { NextResponse } = require('next/server')
    return NextResponse.json(data)
  }),
}))

describe('GET /api/orders', () => {
  let mockOrdersQuery: any
  let mockSupabaseFrom: any

  const createMockQuery = () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    }
    return query
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get the mocked supabaseAdmin
    const { supabaseAdmin } = await import('@/lib/supabase/server')
    mockSupabaseFrom = supabaseAdmin.from

    mockOrdersQuery = createMockQuery()

    // Make select() return the query object so chaining works
    mockOrdersQuery.select.mockReturnValue(mockOrdersQuery)

    mockSupabaseFrom.mockReturnValue(mockOrdersQuery)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = (searchParams?: Record<string, string>) => {
    const url = new URL('http://localhost:3000/api/orders')
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }
    return new NextRequest(url)
  }

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should allow authenticated users to access their orders', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: 'user',
        },
      } as any)

      // Mock the final query result (after all chaining)
      mockOrdersQuery.range.mockResolvedValue({
        data: [
          {
            id: 'order-1',
            user_id: 'user-id',
            order_number: 'ORD-001',
            status: 'pending',
            total_amount: 1000,
            order_items: [],
          },
        ],
        error: null,
        count: 1,
      })

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.orders).toBeDefined()
      expect(mockOrdersQuery.eq).toHaveBeenCalledWith('user_id', 'user-id')
    })
  })

  describe('Authorization', () => {
    it('should filter orders by user_id for non-admin users', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: 'user',
        },
      } as any)

      mockOrdersQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest()
      await GET(request)

      expect(mockOrdersQuery.eq).toHaveBeenCalledWith('user_id', 'user-id')
    })

    it('should allow admins to see all orders', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: 'admin',
        },
      } as any)

      mockOrdersQuery.range.mockResolvedValue({
        data: [
          {
            id: 'order-1',
            user_id: 'user-id',
            order_number: 'ORD-001',
            status: 'pending',
            total_amount: 1000,
            order_items: [],
          },
          {
            id: 'order-2',
            user_id: 'user-id-2',
            order_number: 'ORD-002',
            status: 'completed',
            total_amount: 2000,
            order_items: [],
          },
        ],
        error: null,
        count: 2,
      })

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.orders).toHaveLength(2)
      // Admin should not have user_id filter
      expect(mockOrdersQuery.eq).not.toHaveBeenCalledWith(
        'user_id',
        expect.any(String)
      )
    })
  })

  describe('Filtering', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: 'user',
        },
      } as any)
    })

    it('should filter by status', async () => {
      mockOrdersQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest({ status: 'pending' })
      await GET(request)

      expect(mockOrdersQuery.eq).toHaveBeenCalledWith('status', 'pending')
    })

    it('should not filter by status if status is "all"', async () => {
      mockOrdersQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest({ status: 'all' })
      await GET(request)

      expect(mockOrdersQuery.eq).not.toHaveBeenCalledWith('status', 'all')
    })

    it('should filter by payment_status', async () => {
      mockOrdersQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest({ payment_status: 'paid' })
      await GET(request)

      expect(mockOrdersQuery.eq).toHaveBeenCalledWith('payment_status', 'paid')
    })

    it('should filter by day', async () => {
      mockOrdersQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest({ day: '2024-01-15' })
      await GET(request)

      expect(mockOrdersQuery.gte).toHaveBeenCalled()
      expect(mockOrdersQuery.lte).toHaveBeenCalled()
    })

    it('should filter by month', async () => {
      mockOrdersQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest({ month: '2024-01' })
      await GET(request)

      expect(mockOrdersQuery.gte).toHaveBeenCalled()
      expect(mockOrdersQuery.lte).toHaveBeenCalled()
    })

    it('should filter by date range', async () => {
      mockOrdersQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      })
      await GET(request)

      expect(mockOrdersQuery.gte).toHaveBeenCalled()
      expect(mockOrdersQuery.lte).toHaveBeenCalled()
    })

    it('should filter by product_id', async () => {
      mockOrdersQuery.range.mockResolvedValue({
        data: [
          {
            id: 'order-1',
            order_items: [
              { product_id: 'product-1', quantity: 2 },
              { product_id: 'product-2', quantity: 1 },
            ],
          },
          {
            id: 'order-2',
            order_items: [{ product_id: 'product-1', quantity: 1 }],
          },
        ],
        error: null,
        count: 2,
      })

      const request = createMockRequest({ product_id: 'product-1' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Should filter to only orders containing product-1
      expect(
        data.orders.every((order: any) =>
          order.order_items?.some(
            (item: any) => item.product_id === 'product-1'
          )
        )
      ).toBe(true)
    })
  })

  describe('Search', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: 'user',
        },
      } as any)
    })

    it('should search by order number', async () => {
      mockOrdersQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest({ search: 'ORD-001' })
      await GET(request)

      expect(mockOrdersQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('ORD-001')
      )
    })

    it('should search by customer name', async () => {
      mockOrdersQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest({ search: 'John Doe' })
      await GET(request)

      expect(mockOrdersQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('John Doe')
      )
    })

    it('should search by customer email', async () => {
      mockOrdersQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest({ search: 'john@example.com' })
      await GET(request)

      expect(mockOrdersQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('john@example.com')
      )
    })
  })

  describe('Pagination', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: 'user',
        },
      } as any)
    })

    it('should use default pagination values', async () => {
      mockOrdersQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest()
      await GET(request)

      expect(mockOrdersQuery.range).toHaveBeenCalledWith(0, 49) // page 1, limit 50
    })

    it('should apply custom pagination', async () => {
      mockOrdersQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 100,
      })

      const request = createMockRequest({ page: '2', limit: '20' })
      const response = await GET(request)
      const data = await response.json()

      expect(mockOrdersQuery.range).toHaveBeenCalledWith(20, 39) // page 2, limit 20
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.limit).toBe(20)
      expect(data.pagination.total).toBe(100)
      expect(data.pagination.totalPages).toBe(5)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: 'user',
        },
      } as any)
    })

    it('should return 500 if database query fails', async () => {
      mockOrdersQuery.range.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: 0,
      })

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch orders')
    })

    it('should handle unexpected errors', async () => {
      vi.mocked(getServerSession).mockRejectedValue(
        new Error('Unexpected error')
      )

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})

describe('POST /api/orders', () => {
  const PRODUCT_A = '11111111-1111-4111-8111-111111111111'
  const PRODUCT_B = '22222222-2222-4222-8222-222222222222'
  let supabase: any
  let products: any[]
  let rpcResults: Record<string, { data: any; error: any }>

  const address = {
    name: 'Asha',
    email: 'asha@example.com',
    phone: '9999999999',
    address: '1 MG Road',
    city: 'Mumbai',
  }

  const post = (body: unknown) =>
    POST(
      new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    )

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.NEXTAUTH_SECRET = 'test-secret'
    delete process.env.RAZORPAY_KEY_ID
    delete process.env.RAZORPAY_KEY_SECRET

    products = [
      {
        id: PRODUCT_A,
        name: 'Tulsi Drops',
        sku: 'TD',
        price: 149,
        image: 'https://x/a.jpg',
        images: [],
        is_active: true,
        category_id: null,
      },
      {
        id: PRODUCT_B,
        name: 'Kadha',
        sku: 'KD',
        price: 399,
        image: null,
        images: ['https://x/b.jpg'],
        is_active: true,
        category_id: 'cat-1',
      },
    ]
    rpcResults = {
      place_order: {
        data: { id: 'order-1', order_number: 'ORD-1' },
        error: null,
      },
      expire_stale_online_orders: { data: 0, error: null },
    }

    const { supabaseAdmin } = await import('@/lib/supabase/server')
    supabase = supabaseAdmin
    supabase.rpc = vi.fn((name: string) => {
      const result = rpcResults[name] ?? { data: null, error: null }
      const p: any = Promise.resolve(result)
      return p
    })
    supabase.from.mockImplementation((table: string) => {
      const q: any = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn(() => Promise.resolve({ data: products, error: null })),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(() =>
          Promise.resolve({
            data: { id: 'order-1', order_number: 'ORD-1', order_items: [] },
            error: null,
          })
        ),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      }
      return q
    })
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', role: 'user', email: 'asha@example.com' },
    })
  })

  const placedOrder = () =>
    supabase.rpc.mock.calls.find((c: any[]) => c[0] === 'place_order')?.[1]

  describe('Validation', () => {
    it('returns 400 when items are missing or empty', async () => {
      expect((await post({ shipping_address: address })).status).toBe(400)
      const res = await post({ items: [], shipping_address: address })
      expect(res.status).toBe(400)
      expect((await res.json()).error).toBe('Order items are required')
    })

    it('returns 400 when shipping_address is missing', async () => {
      const res = await post({
        items: [{ product_id: PRODUCT_A, quantity: 1 }],
      })
      expect(res.status).toBe(400)
      expect((await res.json()).error).toBe('Shipping address is required')
    })

    it('rejects non-integer or non-positive quantities', async () => {
      for (const quantity of [0, -2, 1.5]) {
        const res = await post({
          items: [{ product_id: PRODUCT_A, quantity }],
          shipping_address: address,
        })
        expect(res.status).toBe(400)
      }
    })

    it('requires contact details for guest checkout', async () => {
      ;(getServerSession as any).mockResolvedValue(null)
      const res = await post({
        items: [{ product_id: PRODUCT_A, quantity: 1 }],
        shipping_address: { name: 'Guest' },
      })
      expect(res.status).toBe(400)
    })

    it('returns 400 for unknown or inactive products', async () => {
      products = products.filter((p) => p.id !== PRODUCT_B)
      let res = await post({
        items: [{ product_id: PRODUCT_B, quantity: 1 }],
        shipping_address: address,
      })
      expect(res.status).toBe(400)

      products[0].is_active = false
      res = await post({
        items: [{ product_id: PRODUCT_A, quantity: 1 }],
        shipping_address: address,
      })
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/no longer available/)
    })

    it('refuses online payment when the gateway is not configured', async () => {
      const res = await post({
        items: [{ product_id: PRODUCT_A, quantity: 1 }],
        shipping_address: address,
        payment_method: 'online',
      })
      expect(res.status).toBe(400)
      expect(supabase.rpc).not.toHaveBeenCalledWith(
        'place_order',
        expect.anything()
      )
    })
  })

  describe('Server-side pricing', () => {
    it('ignores client-sent prices and totals', async () => {
      const res = await post({
        items: [{ product_id: PRODUCT_A, quantity: 2, price: 1 }],
        shipping_address: address,
        subtotal: 1,
        total_amount: 1,
        discount_amount: 500,
      })
      expect(res.status).toBe(201)
      const { p_order, p_items } = placedOrder()
      expect(p_items[0]).toMatchObject({
        unit_price: 149,
        quantity: 2,
        total_price: 298,
      })
      expect(p_order.subtotal).toBe(298)
      expect(p_order.discount_amount).toBe(0)
      expect(p_order.shipping_amount).toBe(50) // below ₹500
      expect(p_order.total_amount).toBe(348)
    })

    it('gives free shipping at ₹500 and merges duplicate lines', async () => {
      await post({
        items: [
          { product_id: PRODUCT_B, quantity: 1 },
          { product_id: PRODUCT_A, quantity: 1 },
          { product_id: PRODUCT_A, quantity: 1 },
        ],
        shipping_address: address,
      })
      const { p_order, p_items } = placedOrder()
      expect(p_items).toHaveLength(2)
      expect(p_order.subtotal).toBe(697)
      expect(p_order.shipping_amount).toBe(0)
      expect(p_order.total_amount).toBe(697)
      // GST is reported as included, not added on top
      expect(p_order.tax_amount).toBeCloseTo(697 - 697 / 1.18, 2)
    })

    it('applies a server-validated coupon discount', async () => {
      rpcResults.validate_coupon = {
        data: {
          valid: true,
          coupon_id: 'c1',
          code: 'SAVE50',
          name: 'Save',
          discount_amount: 50,
        },
        error: null,
      }
      await post({
        items: [{ product_id: PRODUCT_B, quantity: 2 }],
        shipping_address: address,
        coupon_code: 'save50',
      })
      const { p_order } = placedOrder()
      expect(p_order.coupon_id).toBe('c1')
      expect(p_order.discount_amount).toBe(50)
      expect(p_order.total_amount).toBe(748)
    })

    it('rejects an invalid coupon', async () => {
      rpcResults.validate_coupon = {
        data: { valid: false, error: 'Invalid or expired coupon code' },
        error: null,
      }
      const res = await post({
        items: [{ product_id: PRODUCT_A, quantity: 1 }],
        shipping_address: address,
        coupon_code: 'NOPE',
      })
      expect(res.status).toBe(400)
      expect((await res.json()).error).toBe('Invalid or expired coupon code')
    })
  })

  describe('Atomic placement', () => {
    it('maps OUT_OF_STOCK from place_order to 409', async () => {
      rpcResults.place_order = {
        data: null,
        error: { message: 'OUT_OF_STOCK:Tulsi Drops:3' },
      }
      const res = await post({
        items: [{ product_id: PRODUCT_A, quantity: 5 }],
        shipping_address: address,
      })
      expect(res.status).toBe(409)
      expect((await res.json()).error).toBe(
        'Insufficient stock for Tulsi Drops. Available: 3'
      )
    })

    it('maps COUPON_EXHAUSTED to 409', async () => {
      rpcResults.validate_coupon = {
        data: {
          valid: true,
          coupon_id: 'c1',
          code: 'ONCE',
          name: 'Once',
          discount_amount: 10,
        },
        error: null,
      }
      rpcResults.place_order = {
        data: null,
        error: { message: 'COUPON_EXHAUSTED' },
      }
      const res = await post({
        items: [{ product_id: PRODUCT_A, quantity: 1 }],
        shipping_address: address,
        coupon_code: 'ONCE',
      })
      expect(res.status).toBe(409)
    })

    it('returns 500 on unexpected database errors', async () => {
      rpcResults.place_order = { data: null, error: { message: 'boom' } }
      const res = await post({
        items: [{ product_id: PRODUCT_A, quantity: 1 }],
        shipping_address: address,
      })
      expect(res.status).toBe(500)
    })

    it('creates the order and returns a guest access token', async () => {
      ;(getServerSession as any).mockResolvedValue(null)
      const res = await post({
        items: [{ product_id: PRODUCT_A, quantity: 1 }],
        shipping_address: address,
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.order.id).toBe('order-1')
      const { verifyOrderAccessToken } =
        await import('@/lib/commerce/order-access')
      expect(verifyOrderAccessToken('order-1', body.access_token)).toBe(true)
      expect(placedOrder().p_order.user_id).toBeNull()
    })
  })
})
