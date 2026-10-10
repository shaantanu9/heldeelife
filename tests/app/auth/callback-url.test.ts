import { describe, it, expect } from 'vitest'
import { sanitizeCallbackUrl } from '@/app/auth/callback-url'

describe('sanitizeCallbackUrl', () => {
  const origin = 'https://shop.example.com'

  it('allows same-origin relative paths', () => {
    expect(sanitizeCallbackUrl('/orders/123?x=1')).toBe('/orders/123?x=1')
    expect(sanitizeCallbackUrl('/profile/settings')).toBe('/profile/settings')
  })

  it('falls back for empty values', () => {
    expect(sanitizeCallbackUrl(null)).toBe('/profile')
    expect(sanitizeCallbackUrl('')).toBe('/profile')
    expect(sanitizeCallbackUrl(undefined, '/x')).toBe('/x')
  })

  it('rejects protocol-relative and backslash tricks', () => {
    expect(sanitizeCallbackUrl('//evil.com')).toBe('/profile')
    expect(sanitizeCallbackUrl('/\\evil.com')).toBe('/profile')
    expect(sanitizeCallbackUrl('/foo\\bar')).toBe('/profile')
  })

  it('rejects absolute and scheme URLs', () => {
    expect(sanitizeCallbackUrl('https://evil.com/profile')).toBe('/profile')
    expect(sanitizeCallbackUrl('https://evil.com', '/profile', origin)).toBe(
      '/profile'
    )
    expect(sanitizeCallbackUrl('javascript:alert(1)')).toBe('/profile')
    expect(sanitizeCallbackUrl('evil.com')).toBe('/profile')
  })

  it('reduces same-origin absolute URLs to a path', () => {
    expect(
      sanitizeCallbackUrl(`${origin}/orders/1?a=b#c`, '/profile', origin)
    ).toBe('/orders/1?a=b#c')
  })

  it('rejects control characters and signin loops', () => {
    expect(sanitizeCallbackUrl('/foo\n/bar')).toBe('/profile')
    expect(sanitizeCallbackUrl('/auth/signin?callbackUrl=/x')).toBe('/profile')
  })
})
