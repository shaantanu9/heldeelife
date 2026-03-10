/**
 * Regression tests for abandoned cart recovery route security bug.
 *
 * BUG: `app/api/cart/abandoned/recover/route.ts` had zero auth — any anonymous
 * caller could mark any cart as recovered by guessing/enumerating a UUID cartId.
 *
 * FIX: Added getServerSession check; requires admin OR matching cart email.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/cart/abandoned/recover/route'
import { getServerSession } from 'next-auth'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth-options', () => ({
  authOptions: {},
}))

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}))

const makeRequest = (body: object) =>
  new NextRequest('http://localhost:3000/api/cart/abandoned/recover', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

const createUpdateChain = (error: unknown = null) => {
  const chain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error }),
  }
  return chain
}

const createOwnershipChain = (cartEmail: string | null = 'owner@example.com', fetchError: unknown = null) => {
  const singleChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(
      fetchError ? { data: null, error: fetchError } : { data: { email: cartEmail }, error: null }
    ),
  }
  return singleChain
}

describe('POST /api/cart/abandoned/recover — auth regression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for unauthenticated requests (was 200 before fix)', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    const res = await POST(makeRequest({ cartId: 'some-uuid' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty('error', 'Unauthorized')
  })

  it('returns 403 when non-admin user tries to recover another user\'s cart', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', email: 'attacker@example.com', role: 'user' },
    } as any)

    // Cart belongs to a different email
    const ownershipChain = createOwnershipChain('owner@example.com')
    mockFrom.mockReturnValue(ownershipChain)

    const res = await POST(makeRequest({ cartId: 'victim-cart-uuid' }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).toHaveProperty('error', 'Forbidden')
  })

  it('allows admin to recover any cart', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
    } as any)

    const updateChain = createUpdateChain()
    mockFrom.mockReturnValue(updateChain)

    const res = await POST(makeRequest({ cartId: 'any-cart-uuid' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('success', true)
  })

  it('allows cart owner to recover their own cart', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', email: 'owner@example.com', role: 'user' },
    } as any)

    const ownershipChain = createOwnershipChain('owner@example.com')
    // First call (select for ownership): returns ownershipChain
    // Second call (update): returns updateChain
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockFrom
      .mockReturnValueOnce(ownershipChain)
      .mockReturnValueOnce(updateChain)

    const res = await POST(makeRequest({ cartId: 'my-cart-uuid' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('success', true)
  })

  it('returns 400 when cartId is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
    } as any)

    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error', 'Cart ID is required')
  })
})
