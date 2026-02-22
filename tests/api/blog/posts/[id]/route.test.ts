/**
 * GET /api/blog/posts/[id] - draft and published loadable by admin
 * DELETE /api/blog/posts/[id] - 401/403 for non-admin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, DELETE } from '@/app/api/blog/posts/[id]/route'
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

const createMockChain = (post: { id: string; status: string; [k: string]: unknown } | null) => {
  const updateChain = { eq: vi.fn().mockResolvedValue({ error: null }) }
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(
      post ? { data: post, error: null } : { data: null, error: { code: 'PGRST116' } }
    ),
    update: vi.fn().mockReturnValue(updateChain),
  }
  return chain
}

describe('GET /api/blog/posts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createGetRequest = () => new NextRequest('http://localhost:3000/api/blog/posts/post-1')

  it('returns 200 with draft post when admin is authenticated (draft loadable by admin)', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
    } as any)
    const draftPost = {
      id: 'post-1',
      title: 'Draft',
      slug: 'draft',
      status: 'draft',
      content: '<p>Draft content</p>',
      tags: [],
    }
    const chain = createMockChain(draftPost)
    chain.update.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue(chain)

    const res = await GET(createGetRequest(), {
      params: Promise.resolve({ id: 'post-1' }),
    })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.post).toBeDefined()
    expect(data.post.status).toBe('draft')
  })

  it('returns 200 with published post when admin is authenticated (published loadable by admin)', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
    } as any)
    const publishedPost = {
      id: 'post-1',
      title: 'Published',
      slug: 'published',
      status: 'published',
      content: '<p>Content</p>',
      views_count: 0,
      tags: [],
    }
    const chain = createMockChain(publishedPost)
    mockFrom.mockReturnValue(chain)

    const res = await GET(createGetRequest(), {
      params: Promise.resolve({ id: 'post-1' }),
    })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.post).toBeDefined()
    expect(data.post.status).toBe('published')
  })

  it('returns 404 for missing post', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    } as any)
    const chain = createMockChain(null)
    mockFrom.mockReturnValue(chain)

    const res = await GET(createGetRequest(), {
      params: Promise.resolve({ id: 'post-1' }),
    })
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toMatch(/not found/i)
  })
})

describe('DELETE /api/blog/posts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createDeleteRequest = () =>
    new NextRequest('http://localhost:3000/api/blog/posts/post-1', { method: 'DELETE' })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { author_id: 'u1' }, error: null }),
    }
    mockFrom.mockReturnValue(selectChain)

    const res = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: 'post-1' }),
    })
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 403 when user is authenticated but not admin', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', role: 'user' },
    } as any)
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { author_id: 'u1' }, error: null }),
    }
    mockFrom.mockReturnValue(selectChain)

    const res = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: 'post-1' }),
    })
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.error).toMatch(/admin|forbidden/i)
  })
})
