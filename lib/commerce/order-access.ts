/**
 * Signed, order-scoped access tokens so guests (no session) can pay for,
 * view and track the order they just placed — without exposing any order to
 * someone who merely guesses its UUID.
 */
import { createHmac, timingSafeEqual } from 'crypto'

function secret(): string {
  const value = process.env.ORDER_ACCESS_SECRET || process.env.NEXTAUTH_SECRET
  if (!value) throw new Error('NEXTAUTH_SECRET is not configured')
  return value
}

export function createOrderAccessToken(orderId: string): string {
  return createHmac('sha256', secret())
    .update(`order-access:${orderId}`)
    .digest('base64url')
}

export function verifyOrderAccessToken(
  orderId: string,
  token: string | null | undefined
): boolean {
  if (!token) return false
  const expected = Buffer.from(createOrderAccessToken(orderId))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

type SessionLike = { user?: { id?: string; role?: string } } | null

/**
 * Who may act on an order: admins, the owning user, or anyone holding the
 * order's access token (guest checkout).
 */
export function canAccessOrder(
  order: { id: string; user_id: string | null },
  session: SessionLike,
  token?: string | null
): boolean {
  if (session?.user?.role === 'admin') return true
  if (session?.user?.id && order.user_id === session.user.id) return true
  return verifyOrderAccessToken(order.id, token)
}
