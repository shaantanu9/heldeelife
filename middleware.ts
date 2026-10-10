import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import {
  AB_COOKIE_NAME,
  AB_COOKIE_MAX_AGE,
  pickRandomVariant,
} from '@/lib/ab-testing/select-variant'

/**
 * Routes that require a signed-in user. Unauthenticated requests are
 * redirected by withAuth to /auth/signin?callbackUrl=<original url>.
 */
export function requiresAuth(path: string): boolean {
  if (path === '/admin' || path.startsWith('/admin/')) return true
  if (path === '/profile' || path.startsWith('/profile/')) return true
  if (path === '/orders' || path.startsWith('/orders/')) {
    // Guest checkout lands on /orders/success, so it must stay public.
    if (path === '/orders/success' || path.startsWith('/orders/success/')) {
      return false
    }
    return true
  }
  return false
}

function signInRedirect(req: { url: string; nextUrl: URL }) {
  const signInUrl = new URL('/auth/signin', req.url)
  signInUrl.searchParams.set(
    'callbackUrl',
    `${req.nextUrl.pathname}${req.nextUrl.search}`
  )
  return NextResponse.redirect(signInUrl)
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === 'admin'
    const path = req.nextUrl.pathname

    // Protect admin routes
    if (path.startsWith('/admin')) {
      // If not authenticated, redirect to sign in (keeping callbackUrl)
      if (!token) {
        return signInRedirect(req)
      }
      // If authenticated but not admin, redirect to home
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    const response = NextResponse.next()

    // Assign A/B test variant on first home page visit
    if (path === '/') {
      const existingVariant = req.cookies.get(AB_COOKIE_NAME)?.value
      if (!existingVariant) {
        response.cookies.set(AB_COOKIE_NAME, pickRandomVariant(), {
          maxAge: AB_COOKIE_MAX_AGE,
          path: '/',
          sameSite: 'lax',
          httpOnly: false, // readable client-side for analytics
          secure: process.env.NODE_ENV === 'production',
        })
      }
    }

    return response
  },
  {
    callbacks: {
      // Returning false makes withAuth redirect to pages.signIn with
      // ?callbackUrl=<original url>.
      authorized: ({ token, req }) => {
        if (requiresAuth(req.nextUrl.pathname)) {
          return !!token
        }
        return true
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
)

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/profile/:path*',
    '/orders/:path*',
    '/cart/:path*',
    '/checkout/:path*',
  ],
}
