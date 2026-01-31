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
      expect(data.orders.every((order: any) =>
        order.order_items?.some((item: any) => item.product_id === 'product-1')
      )).toBe(true)
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
      vi.mocked(getServerSession).mockRejectedValue(new Error('Unexpected error'))

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})

describe('POST /api/orders', () => {
  let mockOrdersQuery: any
  let mockProductsQuery: any
  let mockInventoryQuery: any
  let mockOrderItemsQuery: any
  let mockSupabaseFrom: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get the mocked supabaseAdmin
    const { supabaseAdmin } = await import('@/lib/supabase/server')
    mockSupabaseFrom = supabaseAdmin.from

    mockOrdersQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
      eq: vi.fn().mockReturnThis(),
    }

    mockProductsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }

    mockInventoryQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
    }

    mockOrderItemsQuery = {
      insert: vi.fn(),
    }

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'orders') {
        return mockOrdersQuery
      }
      if (table === 'products') {
        return mockProductsQuery
      }
      if (table === 'inventory') {
        return mockInventoryQuery
      }
      if (table === 'order_items') {
        return mockOrderItemsQuery
      }
      return {}
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = createMockRequest({
        items: [{ product_id: 'product-1', quantity: 1 }],
        shipping_address: { name: 'John Doe', address: '123 Main St' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Validation', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: 'user',
        },
      } as any)
    })

    it('should return 400 if items are missing', async () => {
      const request = createMockRequest({
        shipping_address: { name: 'John Doe', address: '123 Main St' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Order items are required')
    })

    it('should return 400 if items array is empty', async () => {
      const request = createMockRequest({
        items: [],
        shipping_address: { name: 'John Doe', address: '123 Main St' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Order items are required')
    })

    it('should return 400 if shipping_address is missing', async () => {
      const request = createMockRequest({
        items: [{ product_id: 'product-1', quantity: 1 }],
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Shipping address is required')
    })
  })

  describe('Product Validation', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: 'user',
        },
      } as any)
    })

    it('should return 400 if product does not exist', async () => {
      mockProductsQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Product not found' },
      })

      const request = createMockRequest({
        items: [
          {
            product_id: 'non-existent',
            name: 'Test Product',
            quantity: 1,
            price: 100,
          },
        ],
        shipping_address: { name: 'John Doe', address: '123 Main St' },
        subtotal: 100,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('not found')
    })

    it('should return 400 if product is not active', async () => {
      mockProductsQuery.single.mockResolvedValue({
        data: {
          id: 'product-1',
          name: 'Test Product',
          is_active: false,
        },
        error: null,
      })

      const request = createMockRequest({
        items: [
          {
            product_id: 'product-1',
            name: 'Test Product',
            quantity: 1,
            price: 100,
          },
        ],
        shipping_address: { name: 'John Doe', address: '123 Main St' },
        subtotal: 100,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('no longer available')
    })
  })

  describe('Inventory Validation', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: 'user',
        },
      } as any)

      mockProductsQuery.single.mockResolvedValue({
        data: {
          id: 'product-1',
          name: 'Test Product',
          is_active: true,
        },
        error: null,
      })
    })

    it('should return 400 if insufficient stock', async () => {
      mockInventoryQuery.single.mockResolvedValue({
        data: {
          quantity: 5,
          reserved_quantity: 3,
        },
        error: null,
      })

      const request = createMockRequest({
        items: [
          {
            product_id: 'product-1',
            name: 'Test Product',
            quantity: 5, // Requesting 5, but only 2 available (5-3)
            price: 100,
          },
        ],
        shipping_address: { name: 'John Doe', address: '123 Main St' },
        subtotal: 500,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Insufficient stock')
    })

    it('should allow order if sufficient stock available', async () => {
      mockInventoryQuery.single.mockResolvedValue({
        data: {
          quantity: 10,
          reserved_quantity: 2,
        },
        error: null,
      })

      const mockOrder = {
        id: 'order-1',
        user_id: 'user-id',
        order_number: 'ORD-001',
        status: 'pending',
        total_amount: 100,
      }

      // Mock insert chain: insert().select().single()
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      }
      mockOrdersQuery.insert.mockReturnValue(insertChain)
      insertChain.single.mockResolvedValue({
        data: mockOrder,
        error: null,
      })

      mockOrderItemsQuery.insert.mockResolvedValue({
        data: [],
        error: null,
      })

      // Mock final select for complete order
      const selectChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      }
      mockOrdersQuery.select.mockReturnValue(selectChain)
      selectChain.single.mockResolvedValue({
        data: {
          ...mockOrder,
          order_items: [],
        },
        error: null,
      })

      const request = createMockRequest({
        items: [
          {
            product_id: 'product-1',
            name: 'Test Product',
            quantity: 5, // Requesting 5, 8 available (10-2)
            price: 100,
          },
        ],
        shipping_address: { name: 'John Doe', address: '123 Main St' },
        subtotal: 500,
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })
  })

  describe('Order Creation', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: 'user',
        },
      } as any)

      mockProductsQuery.single.mockResolvedValue({
        data: {
          id: 'product-1',
          name: 'Test Product',
          is_active: true,
          image: 'https://example.com/image.jpg',
        },
        error: null,
      })

      mockInventoryQuery.single.mockResolvedValue({
        data: {
          id: 'inventory-1',
          quantity: 10,
          reserved_quantity: 0,
        },
        error: null,
      })

      // Setup insert chain for orders: insert().select().single()
      const insertSelectChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      }
      mockOrdersQuery.insert.mockReturnValue(insertSelectChain)

      // Setup select chain for fetching complete order: select().eq().single()
      const selectEqChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      }
      mockOrdersQuery.select.mockReturnValue(selectEqChain)
    })

    it('should create order successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        user_id: 'user-id',
        order_number: 'ORD-001',
        status: 'pending',
        payment_status: 'pending',
        total_amount: 1000,
        subtotal: 900,
        tax_amount: 50,
        shipping_amount: 50,
        discount_amount: 0,
      }

      // Mock insert().select().single() chain
      const insertChain = mockOrdersQuery.insert()
      insertChain.single.mockResolvedValue({
        data: mockOrder,
        error: null,
      })

      mockOrderItemsQuery.insert.mockResolvedValue({
        data: [],
        error: null,
      })

      // Mock select().eq().single() chain for final order fetch
      const selectChain = mockOrdersQuery.select()
      selectChain.single.mockResolvedValue({
        data: {
          ...mockOrder,
          order_items: [
            {
              id: 'item-1',
              product_id: 'product-1',
              product_name: 'Test Product',
              quantity: 1,
              unit_price: 900,
              total_price: 900,
            },
          ],
        },
        error: null,
      })

      const request = createMockRequest({
        items: [
          {
            product_id: 'product-1',
            name: 'Test Product',
            quantity: 1,
            price: 900,
          },
        ],
        shipping_address: {
          name: 'John Doe',
          address: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        },
        subtotal: 900,
        tax_amount: 50,
        shipping_amount: 50,
        payment_method: 'cod',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.order).toBeDefined()
      expect(data.order.id).toBe('order-1')
      expect(mockOrdersQuery.insert).toHaveBeenCalled()
    })

    it('should use billing_address if provided, otherwise use shipping_address', async () => {
      const mockOrder = {
        id: 'order-1',
        user_id: 'user-id',
        order_number: 'ORD-001',
        status: 'pending',
        payment_status: 'pending',
        total_amount: 1000,
        subtotal: 1000,
      }

      // Mock insert().select().single() chain
      const insertChain = mockOrdersQuery.insert()
      insertChain.single.mockResolvedValue({
        data: mockOrder,
        error: null,
      })

      mockOrderItemsQuery.insert.mockResolvedValue({
        data: [],
        error: null,
      })

      // Mock select().eq().single() chain for final order fetch
      const selectChain = mockOrdersQuery.select()
      selectChain.single.mockResolvedValue({
        data: { ...mockOrder, order_items: [] },
        error: null,
      })

      const billingAddress = {
        name: 'John Doe',
        address: '456 Billing St',
        city: 'Mumbai',
      }

      const request = createMockRequest({
        items: [
          {
            product_id: 'product-1',
            name: 'Test Product',
            quantity: 1,
            price: 1000,
          },
        ],
        shipping_address: {
          name: 'John Doe',
          address: '123 Main St',
        },
        billing_address: billingAddress,
        subtotal: 1000,
      })

      await POST(request)

      expect(mockOrdersQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          billing_address: billingAddress,
        })
      )
    })

    it('should create order items with product images', async () => {
      const mockOrder = {
        id: 'order-1',
        user_id: 'user-id',
        order_number: 'ORD-001',
        status: 'pending',
        total_amount: 1000,
      }

      // Mock insert().select().single() chain
      const insertChain = mockOrdersQuery.insert()
      insertChain.single.mockResolvedValue({
        data: mockOrder,
        error: null,
      })

      mockOrderItemsQuery.insert.mockResolvedValue({
        data: [],
        error: null,
      })

      // Mock select().eq().single() chain for final order fetch
      const selectChain = mockOrdersQuery.select()
      selectChain.single.mockResolvedValue({
        data: { ...mockOrder, order_items: [] },
        error: null,
      })

      const request = createMockRequest({
        items: [
          {
            product_id: 'product-1',
            name: 'Test Product',
            quantity: 1,
            price: 1000,
            image: 'https://example.com/item-image.jpg',
          },
        ],
        shipping_address: { name: 'John Doe', address: '123 Main St' },
        subtotal: 1000,
      })

      await POST(request)

      expect(mockOrderItemsQuery.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            product_image: 'https://example.com/item-image.jpg',
          }),
        ])
      )
    })

    it('should reserve inventory for COD orders', async () => {
      const mockOrder = {
        id: 'order-1',
        user_id: 'user-id',
        order_number: 'ORD-001',
        status: 'pending',
        total_amount: 1000,
      }

      // Mock insert().select().single() chain
      const insertChain = mockOrdersQuery.insert()
      insertChain.single.mockResolvedValue({
        data: mockOrder,
        error: null,
      })

      mockOrderItemsQuery.insert.mockResolvedValue({
        data: [],
        error: null,
      })

      // Mock select().eq().single() chain for final order fetch
      const selectChain = mockOrdersQuery.select()
      selectChain.single.mockResolvedValue({
        data: { ...mockOrder, order_items: [] },
        error: null,
      })

      // Setup update chain for inventory: update().eq()
      const updateEqChain = {
        eq: vi.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      }
      mockInventoryQuery.update.mockReturnValue(updateEqChain)

      const request = createMockRequest({
        items: [
          {
            product_id: 'product-1',
            name: 'Test Product',
            quantity: 2,
            price: 500,
          },
        ],
        shipping_address: { name: 'John Doe', address: '123 Main St' },
        subtotal: 1000,
        payment_method: 'cod',
      })

      await POST(request)

      // Verify update was called (it returns a chain, so we check the chain was created)
      expect(mockInventoryQuery.update).toHaveBeenCalled()
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

      mockProductsQuery.single.mockResolvedValue({
        data: {
          id: 'product-1',
          name: 'Test Product',
          is_active: true,
        },
        error: null,
      })

      mockInventoryQuery.single.mockResolvedValue({
        data: {
          quantity: 10,
          reserved_quantity: 0,
        },
        error: null,
      })
    })

    it('should return 500 if order creation fails', async () => {
      mockOrdersQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const request = createMockRequest({
        items: [
          {
            product_id: 'product-1',
            name: 'Test Product',
            quantity: 1,
            price: 1000,
          },
        ],
        shipping_address: { name: 'John Doe', address: '123 Main St' },
        subtotal: 1000,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create order')
    })

    it('should rollback order if order items creation fails', async () => {
      const mockOrder = {
        id: 'order-1',
        user_id: 'user-id',
        order_number: 'ORD-001',
        status: 'pending',
        total_amount: 1000,
      }

      // Mock insert().select().single() chain
      const insertChain = mockOrdersQuery.insert()
      insertChain.single.mockResolvedValue({
        data: mockOrder,
        error: null,
      })

      mockOrderItemsQuery.insert.mockResolvedValue({
        data: null,
        error: { message: 'Failed to insert items' },
      })

      // Setup delete chain for rollback: delete().eq()
      const deleteEqChain = {
        eq: vi.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      }
      const deleteQuery = {
        delete: vi.fn().mockReturnValue(deleteEqChain),
      }

      // Track calls to properly return delete query when needed
      // The flow is:
      // 1. from('products') - check product exists
      // 2. from('inventory') - check inventory
      // 3. from('orders') - insert order
      // 4. from('order_items') - insert items (fails)
      // 5. from('orders') - delete order (rollback)
      let ordersCallCount = 0
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'orders') {
          ordersCallCount++
          // First call: insert order
          if (ordersCallCount === 1) {
            return mockOrdersQuery
          }
          // Second call: delete order (rollback)
          if (ordersCallCount === 2) {
            return deleteQuery
          }
          return mockOrdersQuery
        }
        if (table === 'order_items') {
          return mockOrderItemsQuery
        }
        if (table === 'products') {
          return mockProductsQuery
        }
        if (table === 'inventory') {
          return mockInventoryQuery
        }
        return deleteQuery
      })

      const request = createMockRequest({
        items: [
          {
            product_id: 'product-1',
            name: 'Test Product',
            quantity: 1,
            price: 1000,
          },
        ],
        shipping_address: { name: 'John Doe', address: '123 Main St' },
        subtotal: 1000,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create order items')
      // Verify rollback was attempted
      expect(deleteQuery.delete).toHaveBeenCalled()
    })

    it('should handle unexpected errors', async () => {
      vi.mocked(getServerSession).mockRejectedValue(new Error('Unexpected error'))

      const request = createMockRequest({
        items: [
          {
            product_id: 'product-1',
            name: 'Test Product',
            quantity: 1,
            price: 1000,
          },
        ],
        shipping_address: { name: 'John Doe', address: '123 Main St' },
        subtotal: 1000,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})

