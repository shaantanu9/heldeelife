/**
 * Tests for POST /api/inquiries — public contact / consultation / newsletter forms.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockFrom, mockInsert, mockSend } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockInsert: vi.fn(),
  mockSend: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockSend } }
  }),
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 5,
    remaining: 4,
    reset: Date.now() + 600_000,
  }),
  getRateLimitIdentifier: vi.fn().mockReturnValue('127.0.0.1'),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { POST } from '@/app/api/inquiries/route'
import { rateLimit } from '@/lib/rate-limit'

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/inquiries', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

const validContact = {
  type: 'contact',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+91 9876543210',
  subject: 'Question',
  message: 'Hello <script>alert(1)</script>',
}

describe('POST /api/inquiries', () => {
  const originalKey = process.env.RESEND_API_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })
    mockSend.mockResolvedValue({ data: { id: 'email-1' }, error: null })
    process.env.RESEND_API_KEY = 're_test'
  })

  afterEach(() => {
    if (originalKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = originalKey
  })

  describe('validation', () => {
    it('returns 400 for an unknown type', async () => {
      const res = await POST(makeRequest({ type: 'spam', email: 'a@b.com' }))
      expect(res.status).toBe(400)
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('returns 400 for an invalid email', async () => {
      const res = await POST(
        makeRequest({ ...validContact, email: 'not-an-email' })
      )
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('Invalid input')
    })

    it('returns 400 when required contact fields are missing', async () => {
      const res = await POST(
        makeRequest({ type: 'contact', email: 'jane@example.com' })
      )
      expect(res.status).toBe(400)
    })

    it('returns 400 when a field exceeds its max length', async () => {
      const res = await POST(
        makeRequest({ ...validContact, message: 'x'.repeat(5001) })
      )
      expect(res.status).toBe(400)
    })

    it('returns 400 for a consultation with a malformed date', async () => {
      const res = await POST(
        makeRequest({
          type: 'consultation',
          name: 'Jane',
          email: 'jane@example.com',
          phone: '9876543210',
          service: 'General Consultation',
          date: 'tomorrow',
          time: '10:00',
        })
      )
      expect(res.status).toBe(400)
    })

    it('returns 400 for malformed JSON', async () => {
      const res = await POST(makeRequest('{not json'))
      expect(res.status).toBe(400)
    })
  })

  it('returns 200 and persists + emails a valid contact payload', async () => {
    const res = await POST(makeRequest(validContact))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })

    expect(mockFrom).toHaveBeenCalledWith('customer_inquiries')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'contact',
        name: 'Jane Doe',
        email: 'jane@example.com',
        subject: 'Question',
      })
    )

    expect(mockSend).toHaveBeenCalledTimes(1)
    const sent = mockSend.mock.calls[0][0]
    expect(sent.to).toBe(
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@heldeelife.com'
    )
    expect(sent.html).not.toContain('<script>')
    expect(sent.html).toContain('&lt;script&gt;')
  })

  it('returns 200 for a valid newsletter payload without Resend configured', async () => {
    delete process.env.RESEND_API_KEY
    const res = await POST(
      makeRequest({
        type: 'newsletter',
        email: 'news@example.com',
        source: 'exit-intent',
      })
    )
    expect(res.status).toBe(200)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('returns 200 when DB fails but email succeeds', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'db down' } })
    const res = await POST(makeRequest(validContact))
    expect(res.status).toBe(200)
  })

  it('returns 500 with a generic message when DB and email both fail', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'db down secret' } })
    mockSend.mockResolvedValue({
      data: null,
      error: { message: 'resend down' },
    })
    const res = await POST(makeRequest(validContact))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(JSON.stringify(body)).not.toContain('secret')
  })

  it('returns 429 with Retry-After when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 60_000,
    })
    const res = await POST(makeRequest(validContact))
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBeTruthy()
  })
})
