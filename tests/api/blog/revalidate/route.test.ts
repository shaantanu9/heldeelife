import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/blog/revalidate/route'
import { getServerSession } from 'next-auth'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth-options', () => ({
  authOptions: {},
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

describe('POST /api/blog/revalidate', () => {
  const adminSession = {
    user: {
      id: 'admin-id',
      email: 'admin@example.com',
      role: 'admin',
    },
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = (body: { slug?: string; path?: string }) => {
    return new NextRequest('http://localhost:3000/api/blog/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  describe('Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = createMockRequest({})
      const response = await POST(request)
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

      const request = createMockRequest({ slug: 'my-post' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden: Admin access required')
    })
  })

  describe('Input validation', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(adminSession)
    })

    it('should return 400 for invalid slug (special characters)', async () => {
      const request = createMockRequest({ slug: 'my-post/../../../etc' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toMatch(/Invalid slug/)
    })

    it('should return 400 for invalid path (disallowed path)', async () => {
      const request = createMockRequest({ path: '/api/admin/users' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toMatch(/Invalid path/)
    })

    it('should return 200 for valid slug', async () => {
      const request = createMockRequest({ slug: 'my-valid-post' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.revalidated).toBe(true)
      expect(data.message).toMatch(/my-valid-post/)
    })

    it('should return 200 for allowed path /blog', async () => {
      const request = createMockRequest({ path: '/blog' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.revalidated).toBe(true)
    })

    it('should return 200 for allowed path /blog/some-slug', async () => {
      const request = createMockRequest({ path: '/blog/some-slug' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.revalidated).toBe(true)
    })
  })
})
