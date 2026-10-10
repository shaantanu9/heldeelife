import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/addresses/route'
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

describe('GET /api/addresses', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { supabaseAdmin } = await import('@/lib/supabase/server')
    supabaseAdmin.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: (res: (r: { data: unknown[] }) => void) =>
        Promise.resolve({ data: [] }).then((r) => res(r)),
      catch: (fn: (e: unknown) => void) => Promise.resolve({ data: [] }).catch(fn),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/addresses')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 200 with addresses array when authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', email: 'u@example.com', role: 'user' },
    } as any)

    const { supabaseAdmin } = await import('@/lib/supabase/server')
    const chain3 = { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
    const chain2: Record<string, unknown> = {}
    chain2.select = vi.fn().mockReturnValue(chain2)
    chain2.eq = vi.fn().mockReturnValue(chain2)
    chain2.order = vi.fn().mockReturnValue(chain3)
    supabaseAdmin.from.mockReturnValue(chain2)

    const request = new NextRequest('http://localhost:3000/api/addresses')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('addresses')
    expect(Array.isArray(data.addresses)).toBe(true)
  })
})
