import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/analytics/metrics/route'
import { getServerSession } from 'next-auth'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth-options', () => ({
  authOptions: {},
}))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

describe('GET /api/analytics/metrics', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { supabaseAdmin } = await import('@/lib/supabase/server')
    const resolved = Promise.resolve({ data: [] })
    const createChain = () => {
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.gte = vi.fn().mockReturnValue(chain)
      chain.lte = vi.fn().mockReturnValue(chain)
      chain.not = vi.fn().mockReturnValue(chain)
      chain.is = vi.fn().mockReturnValue(chain)
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

  const createMockRequest = (searchParams?: Record<string, string>) => {
    const url = new URL('http://localhost:3000/api/analytics/metrics')
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }
    return new NextRequest(url)
  }

  describe('Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 if user is not admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: 'user',
        },
      } as any)

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden: Admin access required')
    })

    it('should return 200 with metrics when admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: 'admin',
        },
      } as any)

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('conversionRate')
      expect(data).toHaveProperty('totalProductViews')
      expect(data).toHaveProperty('totalRevenue')
    })
  })
})
