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

describe('GET /api/products', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { supabaseAdmin } = await import('@/lib/supabase/server')
    const resolved = Promise.resolve({ data: [], count: 0 })
    const createChain = () => {
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.or = vi.fn().mockReturnValue(chain)
      chain.order = vi.fn().mockReturnValue(chain)
      chain.range = vi.fn().mockReturnValue(chain)
      chain.then = resolved.then.bind(resolved)
      chain.catch = resolved.catch.bind(resolved)
      chain.finally = resolved.finally?.bind(resolved)
      return chain
    }
    supabaseAdmin.from.mockImplementation(createChain)
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
})
