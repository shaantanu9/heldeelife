/**
 * Example API Route with Rate Limiting and CORS
 * This demonstrates how to use the rate limiting and CORS utilities
 * 
 * DELETE this file after reviewing - it's just an example
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { corsResponse, handleCorsPreflight } from '@/lib/cors'
import { logger } from '@/lib/logger'

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request)
}

export async function GET(request: NextRequest) {
  try {
    // Get rate limit identifier (IP address)
    const identifier = getRateLimitIdentifier(request)

    // Apply rate limiting (10 requests per 60 seconds)
    const rateLimitResult = await rateLimit(identifier, 10, 60)

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', {
        identifier,
        limit: rateLimitResult.limit,
        reset: new Date(rateLimitResult.reset).toISOString(),
      })

      return corsResponse(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil(
            (rateLimitResult.reset - Date.now()) / 1000
          ),
        },
        429,
        request
      )
    }

    // Your business logic here
    const data = {
      message: 'Success',
      rateLimit: {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: new Date(rateLimitResult.reset).toISOString(),
      },
    }

    logger.info('API request successful', {
      identifier,
      path: request.nextUrl.pathname,
    })

    return corsResponse(data, 200, request)
  } catch (error) {
    logger.error('Error in GET /api/example-rate-limited', error as Error)

    return corsResponse(
      { error: 'Internal server error' },
      500,
      request
    )
  }
}







