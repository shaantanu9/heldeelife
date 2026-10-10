import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/products/route'

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock('@/lib/utils/cache-headers', () => ({
  createCachedResponse: vi.fn((data: unknown) => {
    const { NextResponse } = require('next/server')
    return NextResponse.json(data)
  }),
}))

let lastChain: Record<string, any> | null = null
let queryResult: { data: unknown[]; count: number } = { data: [], count: 0 }

describe('GET /api/products', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    queryResult = { data: [], count: 0 }
    const { supabaseAdmin } = await import('@/lib/supabase/server')
    const createChain = () => {
      const resolved = Promise.resolve(queryResult)
      const chain: Record<string, unknown> = {}
      lastChain = chain
      chain.select = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.neq = vi.fn().mockReturnValue(chain)
      chain.or = vi.fn().mockReturnValue(chain)
      chain.order = vi.fn().mockReturnValue(chain)
      chain.range = vi.fn().mockReturnValue(chain)
      chain.then = resolved.then.bind(resolved)
      chain.catch = resolved.catch.bind(resolved)
      chain.finally = resolved.finally?.bind(resolved)
      return chain
    }
    ;(supabaseAdmin.from as any).mockImplementation(createChain)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return 200 with products array and count', async () => {
    const request = new NextRequest('http://localhost:3000/api/products')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('products')
    expect(Array.isArray(data.products)).toBe(true)
    expect(data).toHaveProperty('count')
  })

  it('maps nested inventory to inStock / stockQuantity / product_id', async () => {
    queryResult = {
      data: [
        { id: 'p1', name: 'A', inventory: [{ available_quantity: 5 }] },
        { id: 'p2', name: 'B', inventory: { available_quantity: 0 } },
        { id: 'p3', name: 'C', inventory: [] },
        { id: 'p4', name: 'D', inventory: null },
      ],
      count: 4,
    }
    const request = new NextRequest('http://localhost:3000/api/products')
    const response = await GET(request)
    const data = await response.json()

    expect(data.products).toHaveLength(4)
    expect(data.products[0]).toMatchObject({
      id: 'p1',
      product_id: 'p1',
      inStock: true,
      stockQuantity: 5,
    })
    expect(data.products[1]).toMatchObject({ inStock: false, stockQuantity: 0 })
    expect(data.products[2]).toMatchObject({ inStock: false, stockQuantity: 0 })
    expect(data.products[3]).toMatchObject({
      product_id: 'p4',
      inStock: false,
      stockQuantity: 0,
    })
  })

  it('applies the exclude param via neq', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/products?exclude=abc-123'
    )
    await GET(request)
    expect(lastChain?.neq).toHaveBeenCalledWith('id', 'abc-123')
  })

  it('does not call neq when exclude is absent', async () => {
    const request = new NextRequest('http://localhost:3000/api/products')
    await GET(request)
    expect(lastChain?.neq).not.toHaveBeenCalled()
  })

  it('sanitises the search term before building the or() filter', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/products?search=' +
        encodeURIComponent('ash,(wa*gandha)%\\')
    )
    await GET(request)
    const arg = lastChain?.or.mock.calls[0][0] as string
    expect(arg).toContain('name.ilike.%ash wa gandha%')
    expect(arg).not.toMatch(/[()*\\]/)
    expect(arg.split(',')).toHaveLength(3)
  })
})
