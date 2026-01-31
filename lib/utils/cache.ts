/**
 * Advanced Cache Management
 * Multi-layer caching with TTL support
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

/**
 * Browser Cache Manager (localStorage with TTL)
 */
export class BrowserCache {
  private prefix: string

  constructor(prefix = 'heldeelife-cache') {
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttl: number): boolean {
    if (typeof window === 'undefined') return false

    try {
      const entry: CacheEntry<T> = {
        data,
        expiresAt: Date.now() + ttl,
      }
      localStorage.setItem(this.getKey(key), JSON.stringify(entry))
      return true
    } catch (error) {
      console.error('Error setting cache:', error)
      return false
    }
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null

    try {
      const item = localStorage.getItem(this.getKey(key))
      if (!item) return null

      const entry: CacheEntry<T> = JSON.parse(item)

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        this.delete(key)
        return null
      }

      return entry.data
    } catch (error) {
      console.error('Error getting cache:', error)
      return null
    }
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    if (typeof window === 'undefined') return false

    try {
      localStorage.removeItem(this.getKey(key))
      return true
    } catch (error) {
      console.error('Error deleting cache:', error)
      return false
    }
  }

  /**
   * Clear all cache entries with this prefix
   */
  clear(): void {
    if (typeof window === 'undefined') return

    try {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  /**
   * Check if cache entry exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }
}

/**
 * Memory Cache Manager (in-memory with TTL)
 */
export class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(cleanupIntervalMs = 60000) {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, cleanupIntervalMs)
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    })
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Check if cache entry exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Destroy cache and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

/**
 * Cache decorator for functions
 */
export function cache<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: {
    ttl?: number
    keyGenerator?: (...args: Parameters<T>) => string
    cacheType?: 'memory' | 'browser'
  } = {}
): T {
  const { ttl = 5 * 60 * 1000, keyGenerator, cacheType = 'memory' } = options
  const cache = cacheType === 'memory' ? new MemoryCache() : new BrowserCache()

  return (async (...args: Parameters<T>) => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : `cache:${fn.name}:${JSON.stringify(args)}`

    // Check cache
    const cached = cache.get(key)
    if (cached !== null) {
      return cached
    }

    // Execute function
    const result = await fn(...args)

    // Store in cache
    cache.set(key, result, ttl)

    return result
  }) as T
}

// Singleton instances
export const browserCache = new BrowserCache()
export const memoryCache = new MemoryCache()
