import { describe, it, expect, vi, afterEach } from 'vitest'
import { apiClient } from '@/lib/api/client'

describe('apiClient URL building', () => {
  afterEach(() => vi.restoreAllMocks())

  it('keeps the /api base path for endpoints with a leading slash', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' },
      })
    )
    await apiClient.get('/orders', { limit: 5 })
    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.pathname).toBe('/api/orders')
    expect(url.searchParams.get('limit')).toBe('5')
  })
})
