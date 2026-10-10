import { describe, it, expect, vi } from 'vitest'

vi.mock('next-auth/middleware', () => ({
  withAuth: (fn: unknown, opts: unknown) => ({ fn, opts }),
}))

import middleware, { requiresAuth, config } from '@/middleware'

describe('middleware route protection', () => {
  it('protects admin, profile and orders', () => {
    expect(requiresAuth('/admin')).toBe(true)
    expect(requiresAuth('/admin/orders')).toBe(true)
    expect(requiresAuth('/profile')).toBe(true)
    expect(requiresAuth('/profile/orders/abc')).toBe(true)
    expect(requiresAuth('/orders')).toBe(true)
    expect(requiresAuth('/orders/abc')).toBe(true)
  })

  it('keeps guest-reachable routes public', () => {
    expect(requiresAuth('/orders/success')).toBe(false)
    expect(requiresAuth('/')).toBe(false)
    expect(requiresAuth('/cart')).toBe(false)
    expect(requiresAuth('/checkout')).toBe(false)
    expect(requiresAuth('/ordersomething')).toBe(false)
  })

  it('authorized callback requires a token only on protected routes', () => {
    const authorized = (middleware as any).opts.callbacks.authorized
    const req = (p: string) => ({ nextUrl: new URL(`http://x${p}`) })
    expect(authorized({ token: null, req: req('/profile') })).toBe(false)
    expect(authorized({ token: { id: '1' }, req: req('/profile') })).toBe(true)
    expect(authorized({ token: null, req: req('/orders/success') })).toBe(true)
    expect(authorized({ token: null, req: req('/') })).toBe(true)
  })

  it('matches /orders routes', () => {
    expect(config.matcher).toContain('/orders/:path*')
  })
})
