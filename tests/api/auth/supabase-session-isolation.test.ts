import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Regression tests: session-creating Supabase auth calls must never run on
 * the shared service-role client (supabaseAdmin). auth-js keeps the session in
 * memory and supabase-js would then send that user's JWT on every later
 * supabaseAdmin.from() query.
 */

const isolated = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
}))

const createClientMock = vi.hoisted(() =>
  vi.fn(() => ({
    auth: {
      signInWithPassword: isolated.signInWithPassword,
      signUp: isolated.signUp,
    },
  }))
)

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}))

const admin = vi.hoisted(() => {
  const chain: Record<string, any> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.insert = vi.fn(() => Promise.resolve({ error: null }))
  chain.order = vi.fn(() => chain)
  chain.limit = vi.fn(() => chain)
  chain.single = vi.fn(() =>
    Promise.resolve({
      data: {
        id: 'user-1',
        role: 'user',
        full_name: 'Jane',
        phone_number: null,
      },
      error: null,
    })
  )
  return {
    chain,
    client: {
      from: vi.fn(() => chain),
      rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        setSession: vi.fn(),
        updateUser: vi.fn(),
        getUser: vi.fn(),
        admin: {
          updateUserById: vi.fn(),
        },
      },
    },
  }
})

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: admin.client,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => Promise.resolve({ success: true, reset: 0 })),
  getRateLimitIdentifier: vi.fn(() => '127.0.0.1'),
}))

beforeEach(() => {
  vi.clearAllMocks()
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_ANON_KEY = 'anon-key'
})

describe('NextAuth credentials authorize', () => {
  it('verifies the password on a separate per-request client, not supabaseAdmin', async () => {
    isolated.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'jane@example.com', user_metadata: {} },
      },
      error: null,
    })

    const { authOptions } = await import('@/lib/auth-options')
    const provider: any = authOptions.providers[0]
    const authorize = provider.options?.authorize ?? provider.authorize

    const user = await authorize(
      { emailOrPhone: 'jane@example.com', password: 'secret123' },
      {}
    )

    expect(createClientMock).toHaveBeenCalledTimes(1)
    const [, key, opts] = createClientMock.mock.calls[0] as any[]
    expect(key).toBe('anon-key')
    expect(opts.auth).toMatchObject({
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    })
    expect(isolated.signInWithPassword).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'secret123',
    })
    expect(admin.client.auth.signInWithPassword).not.toHaveBeenCalled()
    expect(user).toMatchObject({ id: 'user-1', email: 'jane@example.com' })
  })

  it('creates a fresh client for every sign-in attempt', async () => {
    isolated.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials', status: 400 },
    })
    const { authOptions } = await import('@/lib/auth-options')
    const provider: any = authOptions.providers[0]
    const authorize = provider.options?.authorize ?? provider.authorize
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await authorize({ emailOrPhone: 'a@example.com', password: 'x' }, {})
    await authorize({ emailOrPhone: 'b@example.com', password: 'y' }, {})

    expect(createClientMock).toHaveBeenCalledTimes(2)
    expect(admin.client.auth.signInWithPassword).not.toHaveBeenCalled()
  })
})

describe('jwt callback', () => {
  it('refreshes name/phone from public.users on trigger=update', async () => {
    admin.chain.single.mockResolvedValueOnce({
      data: {
        role: 'user',
        full_name: 'New Name',
        phone_number: '+911234567890',
      },
      error: null,
    })
    const { authOptions } = await import('@/lib/auth-options')
    const token = await authOptions.callbacks!.jwt!({
      token: {
        id: 'user-1',
        email: 'jane@example.com',
        name: 'Old Name',
        role: 'user',
        roleRefreshedAt: Date.now(),
      },
      trigger: 'update',
      // a malicious client-supplied payload must be ignored
      session: { user: { role: 'admin', name: 'Hacker' } },
    } as any)

    expect(token.name).toBe('New Name')
    expect(token.phoneNumber).toBe('+911234567890')
    expect(token.role).toBe('user')
  })
})

describe('POST /api/auth/reset-password', () => {
  it('uses getUser + admin.updateUserById and never sets a session on supabaseAdmin', async () => {
    admin.client.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    admin.client.auth.admin.updateUserById.mockResolvedValue({ error: null })

    const { POST } = await import('@/app/api/auth/reset-password/route')
    const res = await POST(
      new NextRequest('http://localhost/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          accessToken: 'recovery-jwt',
          password: 'newpass1',
        }),
      })
    )

    expect(res.status).toBe(200)
    expect(admin.client.auth.getUser).toHaveBeenCalledWith('recovery-jwt')
    expect(admin.client.auth.admin.updateUserById).toHaveBeenCalledWith(
      'user-1',
      { password: 'newpass1' }
    )
    expect(admin.client.auth.setSession).not.toHaveBeenCalled()
    expect(admin.client.auth.updateUser).not.toHaveBeenCalled()
  })

  it('rejects an invalid token', async () => {
    admin.client.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid JWT' },
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { POST } = await import('@/app/api/auth/reset-password/route')
    const res = await POST(
      new NextRequest('http://localhost/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ accessToken: 'bad', password: 'newpass1' }),
      })
    )
    expect(res.status).toBe(400)
    expect(admin.client.auth.admin.updateUserById).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/signup', () => {
  it('signs up via a separate client, not supabaseAdmin.auth.signUp', async () => {
    isolated.signUp.mockResolvedValue({
      data: { user: { id: 'new-user', email: 'new@example.com' } },
      error: null,
    })
    const { POST } = await import('@/app/api/auth/signup/route')
    const res = await POST(
      new NextRequest('http://localhost/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          emailOrPhone: 'new@example.com',
          password: 'secret123',
          fullName: 'New',
        }),
      })
    )

    expect(res.status).toBe(200)
    expect(createClientMock).toHaveBeenCalledTimes(1)
    expect(isolated.signUp).toHaveBeenCalled()
    expect(admin.client.auth.signUp).not.toHaveBeenCalled()
  })
})
