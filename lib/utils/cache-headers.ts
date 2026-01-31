/**
 * Cache Headers Utilities
 * Provides consistent cache control headers for API routes and pages
 */

import { NextResponse } from 'next/server'

export interface CacheOptions {
  /**
   * Maximum age in seconds for shared caches (CDN, proxies)
   */
  sMaxAge?: number
  /**
   * Maximum age in seconds for private caches (browsers)
   */
  maxAge?: number
  /**
   * Stale-while-revalidate time in seconds
   * Serves stale content while revalidating in background
   */
  staleWhileRevalidate?: number
  /**
   * Whether the response can be cached by public caches
   */
  public?: boolean
  /**
   * Whether the response must be revalidated before serving
   */
  mustRevalidate?: boolean
  /**
   * Whether the response should not be cached
   */
  noCache?: boolean
  /**
   * Whether the response should not be stored
   */
  noStore?: boolean
}

/**
 * Generate Cache-Control header string
 */
export function generateCacheControl(options: CacheOptions = {}): string {
  const {
    sMaxAge,
    maxAge,
    staleWhileRevalidate,
    public: isPublic = true,
    mustRevalidate = false,
    noCache = false,
    noStore = false,
  } = options

  if (noStore) {
    return 'no-store'
  }

  if (noCache) {
    return 'no-cache, must-revalidate'
  }

  const directives: string[] = []

  if (isPublic) {
    directives.push('public')
  } else {
    directives.push('private')
  }

  if (maxAge !== undefined) {
    directives.push(`max-age=${maxAge}`)
  }

  if (sMaxAge !== undefined) {
    directives.push(`s-maxage=${sMaxAge}`)
  }

  if (staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`)
  }

  if (mustRevalidate) {
    directives.push('must-revalidate')
  }

  return directives.join(', ')
}

/**
 * Predefined cache strategies
 */
export const CACHE_STRATEGIES = {
  /**
   * Static content that rarely changes (categories, tags)
   * Cache for 1 hour, serve stale for 1 day
   */
  static: (): string =>
    generateCacheControl({
      sMaxAge: 3600, // 1 hour
      maxAge: 3600,
      staleWhileRevalidate: 86400, // 1 day
    }),

  /**
   * Dynamic content that changes moderately (products, blog posts)
   * Cache for 5 minutes, serve stale for 1 hour
   */
  dynamic: (): string =>
    generateCacheControl({
      sMaxAge: 300, // 5 minutes
      maxAge: 300,
      staleWhileRevalidate: 3600, // 1 hour
    }),

  /**
   * Frequently changing content (orders, cart)
   * Cache for 2 minutes, serve stale for 10 minutes
   */
  frequent: (): string =>
    generateCacheControl({
      sMaxAge: 120, // 2 minutes
      maxAge: 120,
      staleWhileRevalidate: 600, // 10 minutes
    }),

  /**
   * User-specific content that should not be cached publicly
   * Cache for 1 minute in browser only
   */
  private: (): string =>
    generateCacheControl({
      public: false,
      maxAge: 60, // 1 minute
      mustRevalidate: true,
    }),

  /**
   * No caching (sensitive data, real-time data)
   */
  noCache: (): string => generateCacheControl({ noCache: true }),

  /**
   * No storage (very sensitive data)
   */
  noStore: (): string => generateCacheControl({ noStore: true }),
} as const

/**
 * Add cache headers to NextResponse
 */
export function withCacheHeaders(
  response: NextResponse,
  strategy: keyof typeof CACHE_STRATEGIES | CacheOptions
): NextResponse {
  const cacheControl =
    typeof strategy === 'string'
      ? CACHE_STRATEGIES[strategy]()
      : generateCacheControl(strategy)

  response.headers.set('Cache-Control', cacheControl)

  // Add ETag support hint
  response.headers.set('Vary', 'Accept-Encoding')

  return response
}

/**
 * Create a cached NextResponse
 */
export function createCachedResponse(
  data: unknown,
  strategy: keyof typeof CACHE_STRATEGIES | CacheOptions = 'dynamic'
): NextResponse {
  const response = NextResponse.json(data)
  return withCacheHeaders(response, strategy)
}









