import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { AB_COOKIE_NAME, AB_COOKIE_MAX_AGE, pickRandomVariant } from '@/lib/ab-testing/select-variant'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === 'admin'
    const path = req.nextUrl.pathname

    // Protect admin routes
    if (path.startsWith('/admin')) {
      // If not authenticated, redirect to sign in
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
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
        })
      }
    }

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Admin routes require authentication
        if (path.startsWith('/admin')) {
          return !!token
        }

        // Other routes don't require auth check here
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/profile/:path*',
    '/cart/:path*',
    '/checkout/:path*',
  ],
}
