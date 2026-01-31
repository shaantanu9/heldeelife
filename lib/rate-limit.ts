/**
 * Rate Limiting Utility
 * Provides rate limiting for API routes
 * 
 * Option 1: Simple in-memory rate limiting (for development/single instance)
 * Option 2: Upstash Redis rate limiting (for production/multi-instance)
 */

interface RateLimitOptions {
  limit: number
  window: number // in seconds
  identifier: string
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// Simple in-memory store (for development)
class MemoryRateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map()

  async limit(options: RateLimitOptions): Promise<RateLimitResult> {
    const { limit, window, identifier } = options
    const now = Date.now()
    const resetTime = now + window * 1000

    const record = this.store.get(identifier)

    if (!record || record.resetTime < now) {
      // New or expired record
      this.store.set(identifier, { count: 1, resetTime })
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: resetTime,
      }
    }

    if (record.count >= limit) {
      // Rate limit exceeded
      return {
        success: false,
        limit,
        remaining: 0,
        reset: record.resetTime,
      }
    }

    // Increment count
    record.count++
    this.store.set(identifier, record)

    return {
      success: true,
      limit,
      remaining: limit - record.count,
      reset: record.resetTime,
    }
  }

  // Clean up expired entries periodically
  cleanup() {
    const now = Date.now()
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime < now) {
        this.store.delete(key)
      }
    }
  }
}

// Upstash Redis rate limiter (for production)
class UpstashRateLimiter {
  private redisUrl: string
  private redisToken: string

  constructor() {
    this.redisUrl = process.env.UPSTASH_REDIS_REST_URL || ''
    this.redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || ''
  }

  async limit(options: RateLimitOptions): Promise<RateLimitResult> {
    if (!this.redisUrl || !this.redisToken) {
      // Fallback to memory limiter if Upstash not configured
      return memoryLimiter.limit(options)
    }

    try {
      const { limit, window, identifier } = options
      const key = `ratelimit:${identifier}`
      const now = Date.now()
      const resetTime = now + window * 1000

      // Use Upstash REST API
      const response = await fetch(
        `${this.redisUrl}/pipeline`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.redisToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            ['INCR', key],
            ['EXPIRE', key, window],
            ['GET', key],
          ]),
        }
      )

      if (!response.ok) {
        throw new Error('Upstash rate limit check failed')
      }

      const results = await response.json()
      const count = results[2]?.result || 0

      if (count > limit) {
        return {
          success: false,
          limit,
          remaining: 0,
          reset: resetTime,
        }
      }

      return {
        success: true,
        limit,
        remaining: Math.max(0, limit - count),
        reset: resetTime,
      }
    } catch (error) {
      // Fallback to memory limiter on error
      console.error('Upstash rate limit error, falling back to memory:', error)
      return memoryLimiter.limit(options)
    }
  }
}

// Initialize rate limiters
const memoryLimiter = new MemoryRateLimiter()
const upstashLimiter = new UpstashRateLimiter()

// Clean up memory store every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    memoryLimiter.cleanup()
  }, 5 * 60 * 1000)
}

/**
 * Rate limit a request
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param limit - Maximum number of requests
 * @param window - Time window in seconds
 */
export async function rateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 60
): Promise<RateLimitResult> {
  const options: RateLimitOptions = {
    limit,
    window,
    identifier,
  }

  // Use Upstash if configured, otherwise use memory
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return upstashLimiter.limit(options)
  }

  return memoryLimiter.limit(options)
}

/**
 * Get rate limit identifier from request
 */
export function getRateLimitIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'

  return ip
}







