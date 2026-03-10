import NextAuth from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth-options'
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'

const handler = NextAuth(authOptions)

// Rate limit sign-in POST requests: 10 attempts per minute per IP
async function POST(req: NextRequest, context: any) {
  const url = new URL(req.url)
  if (url.pathname.endsWith('/signin')) {
    const ip = getRateLimitIdentifier(req)
    const rateLimitResult = await rateLimit(`signin:${ip}`, 10, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)) } }
      )
    }
  }
  return handler(req, context)
}

export { handler as GET, POST }
