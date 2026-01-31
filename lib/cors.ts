import { NextRequest, NextResponse } from 'next/server'

/**
 * CORS Configuration Utility
 * Handles Cross-Origin Resource Sharing for API routes
 */

const allowedOrigins = [
  process.env.NEXT_PUBLIC_SITE_URL,
  'https://heldeelife.com',
  'https://www.heldeelife.com',
  'http://localhost:5678',
  'http://localhost:3000',
].filter(Boolean) as string[]

/**
 * Get CORS headers for a given origin
 */
export function getCorsHeaders(origin?: string | null) {
  const requestOrigin = origin || ''
  const isAllowed =
    allowedOrigins.some(
      (allowed) => allowed && requestOrigin.startsWith(allowed)
    ) || process.env.NODE_ENV === 'development'

  return {
    'Access-Control-Allow-Origin': isAllowed ? requestOrigin : allowedOrigins[0]!,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  }
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflight(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = getCorsHeaders(origin)

  return NextResponse.json({}, { status: 200, headers })
}

/**
 * Add CORS headers to response
 */
export function withCors(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const origin = request.headers.get('origin')
  const headers = getCorsHeaders(origin)

  // Add CORS headers to existing headers
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * Create a CORS-enabled response
 */
export function corsResponse(
  data: any,
  status: number = 200,
  request: NextRequest
): NextResponse {
  const response = NextResponse.json(data, { status })
  return withCors(response, request)
}







