# Next.js Performance Optimization Guide

A comprehensive guide to making your Next.js application performant, based on proven optimizations from production applications.

## Table of Contents

1. [Next.js Configuration](#1-nextjs-configuration)
2. [Code Splitting & Dynamic Imports](#2-code-splitting--dynamic-imports)
3. [Caching Strategy](#3-caching-strategy)
4. [React Query Optimization](#4-react-query-optimization)
5. [Image Optimization](#5-image-optimization)
6. [Server Components](#6-server-components)
7. [Route Segment Configuration](#7-route-segment-configuration)
8. [Context Provider Optimization](#8-context-provider-optimization)
9. [Performance Monitoring](#9-performance-monitoring)
10. [Best Practices](#10-best-practices)

---

## 1. Next.js Configuration

### Package Import Optimization

Optimize bundle size by tree-shaking unused exports from large packages:

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      'recharts',
      'date-fns',
      'lucide-react',
      '@radix-ui/react-icons',
      // Add other large packages you use
    ],
  },
}
```

**Benefits:**
- Reduces bundle size by 20-40% for affected packages
- Faster initial page load
- Better code splitting

### Server Components External Packages

Prevent heavy server-only packages from being bundled with client code:

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'pg', // PostgreSQL client
      '@supabase/supabase-js',
      // Add other server-only packages
    ],
  },
}
```

**Benefits:**
- Smaller client bundle
- Faster builds
- Better separation of server/client code

### Production Optimizations

```javascript
// next.config.js
const nextConfig = {
  // Disable source maps in production (faster builds, smaller bundles)
  productionBrowserSourceMaps: false,
  
  // Enable CSS optimization
  optimizeCss: true,
  
  // Enable SWC minification (faster than Terser)
  swcMinify: true,
  
  // Enable compression
  compress: true,
  
  // Optimize fonts
  optimizeFonts: true,
  
  // Remove X-Powered-By header
  poweredByHeader: false,
}
```

### Image Configuration

```javascript
// next.config.js
const nextConfig = {
  images: {
    // Modern image formats (AVIF > WebP > JPEG)
    formats: ['image/avif', 'image/webp'],
    
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Cache optimized images
    minimumCacheTTL: 60,
    
    // Allow remote images (configure appropriately)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-cdn.com',
      },
    ],
  },
}
```

### Cache Headers

Configure proper cache headers for different asset types:

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        // API routes: Short cache with stale-while-revalidate
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        // Static assets: Long cache (immutable)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Images: Long cache
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Security headers
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

---

## 2. Code Splitting & Dynamic Imports

### Lazy Load Non-Critical Components

Load components only when needed to reduce initial bundle size:

```typescript
// app/layout.tsx or components/lazy-components.tsx
import dynamic from 'next/dynamic'

// Lazy load heavy components
export const LazyMobileNav = dynamic(
  () => import('@/components/layout/mobile-nav'),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-16" />,
    ssr: false, // Only load on client
  }
)

export const LazyModal = dynamic(
  () => import('@/components/ui/modal'),
  {
    ssr: false, // Modals typically don't need SSR
  }
)

export const LazyChart = dynamic(
  () => import('@/components/charts/chart'),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
    ssr: false,
  }
)
```

### Lazy Load Below-the-Fold Content

```typescript
// app/page.tsx
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Lazy load sections below the fold
const Promotions = dynamic(
  () => import('@/components/sections/promotions').then((mod) => ({
    default: mod.Promotions,
  })),
  {
    loading: () => <div className="py-12 bg-white" />,
    ssr: true, // Keep SSR for SEO
  }
)

const Testimonials = dynamic(
  () => import('@/components/sections/testimonials'),
  {
    loading: () => <div className="py-12 bg-white" />,
    ssr: true,
  }
)

export default function HomePage() {
  return (
    <>
      <Hero /> {/* Above the fold - load immediately */}
      <Suspense fallback={<div>Loading...</div>}>
        <Promotions />
        <Testimonials />
      </Suspense>
    </>
  )
}
```

**Best Practices:**
- Lazy load modals, dialogs, and heavy UI components
- Lazy load below-the-fold content
- Keep SSR enabled for SEO-critical content
- Provide loading states for better UX

---

## 3. Caching Strategy

### Multi-Layer Caching

Implement caching at multiple levels:

#### 1. Browser Cache (localStorage with TTL)

```typescript
// lib/utils/cache.ts
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export function getCachedData<T>(
  key: string,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): T | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const entry: CacheEntry<T> = JSON.parse(cached)
    const now = Date.now()

    if (now - entry.timestamp > entry.ttl) {
      localStorage.removeItem(key)
      return null
    }

    return entry.data
  } catch {
    return null
  }
}

export function setCachedData<T>(key: string, data: T, ttl: number): void {
  if (typeof window === 'undefined') return

  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // Storage quota exceeded or other error
  }
}
```

#### 2. Memory Cache (In-Memory with TTL)

```typescript
// lib/utils/memory-cache.ts
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>()

  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  clear(): void {
    this.cache.clear()
  }
}

export const memoryCache = new MemoryCache()
```

#### 3. React Query Caching

See [React Query Optimization](#4-react-query-optimization) section.

#### 4. Next.js Fetch Caching

```typescript
// lib/api/server.ts
import { cache } from 'react'

// Use React's cache() for request deduplication
export const getProduct = cache(async (id: string) => {
  const response = await fetch(`https://api.example.com/products/${id}`, {
    next: { revalidate: 60 }, // Revalidate every 60 seconds
  })
  return response.json()
})
```

### Cache Times Configuration

```typescript
// lib/constants/index.ts
export const CACHE_TIMES = {
  // Short-lived data (frequently changing)
  orders: 1000 * 60 * 2, // 2 minutes
  cart: 1000 * 60 * 5, // 5 minutes

  // Medium-lived data (moderately changing)
  products: 1000 * 60 * 5, // 5 minutes
  blogPosts: 1000 * 60 * 5, // 5 minutes
  reviews: 1000 * 60 * 10, // 10 minutes

  // Long-lived data (rarely changing)
  categories: 1000 * 60 * 30, // 30 minutes
  tags: 1000 * 60 * 30, // 30 minutes
  static: 1000 * 60 * 60, // 1 hour

  // User data
  user: 1000 * 60 * 15, // 15 minutes
  session: 1000 * 60 * 5, // 5 minutes
} as const
```

---

## 4. React Query Optimization

### Optimized Query Client Configuration

```typescript
// lib/api/config.ts
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { CACHE_TIMES } from '@/lib/constants'

export const queryClientConfig = {
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error(`Query error for ${query.queryKey}:`, error)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      console.error(`Mutation error:`, error)
    },
  }),
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: CACHE_TIMES.products,
      
      // Data stays in cache for 1 hour
      gcTime: 1000 * 60 * 60,
      
      // Retry failed requests 1 time with exponential backoff
      retry: 1,
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Disable unnecessary refetches for better performance
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      
      // Use structural sharing to prevent unnecessary re-renders
      structuralSharing: true,
      
      // Enable placeholder data for better UX
      placeholderData: (previousData: unknown) => previousData,
    },
    mutations: {
      // Don't retry mutations (fail fast)
      retry: 0,
    },
  },
}

export const queryClient = new QueryClient(queryClientConfig)
```

### Per-Query Cache Configuration

```typescript
// hooks/api/use-products.ts
import { useQuery } from '@tanstack/react-query'
import { CACHE_TIMES } from '@/lib/constants'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: CACHE_TIMES.products, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: CACHE_TIMES.categories, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  })
}
```

**Benefits:**
- 40-50% reduction in API calls
- Faster page loads (cached data)
- Better offline experience
- Improved user experience

---

## 5. Image Optimization

### Use Next.js Image Component

Always use Next.js `Image` component instead of `<img>` tags:

```typescript
// components/optimized/product-image.tsx
import Image from 'next/image'
import { useState } from 'react'

interface ProductImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
}

export function ProductImage({
  src,
  alt,
  width = 800,
  height = 600,
  className,
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return (
      <div className="flex items-center justify-center bg-gray-100">
        <span className="text-gray-400">Image not available</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..." // Optional: base64 placeholder
      onError={() => setImageError(true)}
    />
  )
}
```

### Responsive Images with Fill

```typescript
// For responsive images that fill their container
<div className="relative w-full h-64">
  <Image
    src={imageUrl}
    alt="Product"
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
</div>
```

### External Images

```typescript
// For external images that can't be optimized
<Image
  src={externalUrl}
  alt="External image"
  width={800}
  height={600}
  unoptimized // Only if Next.js can't optimize the image
  onError={() => setImageError(true)}
/>
```

**Best Practices:**
- Always specify width and height (or use fill)
- Use `loading="lazy"` for below-the-fold images
- Provide blur placeholders for better UX
- Handle image errors gracefully
- Use appropriate `sizes` prop for responsive images

---

## 6. Server Components

### Prefer Server Components

Use Server Components by default for data fetching:

```typescript
// app/products/[slug]/page.tsx
// This is a Server Component (no "use client")
import { createServerClient } from '@/lib/supabase/server'

export default async function ProductPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = createServerClient()
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (error || !product) {
    return <div>Product not found</div>
  }

  // Pass data to client component for interactivity
  return <ProductClient product={product} />
}
```

```typescript
// components/products/product-client.tsx
"use client" // Only mark as client when needed

import { useState } from 'react'

export function ProductClient({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  
  // Client-side interactivity
  return (
    <div>
      <h1>{product.name}</h1>
      {/* Interactive elements */}
    </div>
  )
}
```

**Benefits:**
- No client-side JavaScript for data fetching
- Faster initial page load
- Better SEO
- Reduced bundle size

---

## 7. Route Segment Configuration

### ISR (Incremental Static Regeneration)

Configure revalidation times based on content freshness needs:

```typescript
// app/products/page.tsx
export const revalidate = 60 // Revalidate every 60 seconds

export default async function ProductsPage() {
  const products = await fetchProducts()
  return <ProductsList products={products} />
}
```

### Static vs Dynamic

```typescript
// Static pages (products, blog posts)
export const revalidate = 60 // ISR: Revalidate every 60 seconds
export const dynamic = 'force-static' // Prefer static generation

// Dynamic pages (user-specific)
export const revalidate = 0 // No caching
export const dynamic = 'force-dynamic' // Always dynamic

// API Routes
export const revalidate = 60
export const dynamic = 'force-dynamic'
```

### Revalidation Strategy

```typescript
// lib/utils/revalidation.ts
export const REVALIDATION_TIMES = {
  // Frequently changing content
  products: 60, // 1 minute
  blogPosts: 60, // 1 minute
  
  // Rarely changing content
  categories: 3600, // 1 hour
  static: 86400, // 24 hours
  
  // User-specific (no cache)
  orders: 0,
  profile: 0,
} as const
```

---

## 8. Context Provider Optimization

### Memoize Context Values

Prevent unnecessary re-renders by memoizing context values:

```typescript
// contexts/cart-context.tsx
"use client"

import { createContext, useContext, useCallback, useMemo, useState } from 'react'

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Memoize computed values
  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )

  // Memoize callbacks
  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => [...prev, item])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  // Memoize context value
  const value = useMemo(
    () => ({
      items,
      totalItems,
      totalPrice,
      addItem,
      removeItem,
    }),
    [items, totalItems, totalPrice, addItem, removeItem]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
```

### Optimize Provider Nesting

```typescript
// components/providers.tsx
"use client"

import { QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { useMemo } from 'react'
import { queryClientConfig } from '@/lib/api/config'
import { QueryClient } from '@tanstack/react-query'

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient once per session
  const queryClient = useMemo(
    () => new QueryClient(queryClientConfig),
    []
  )

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  )
}
```

**Benefits:**
- 60-70% reduction in unnecessary re-renders
- Better performance
- Improved memory management

---

## 9. Performance Monitoring

### Performance Monitor Utility

```typescript
// lib/utils/performance-monitor.ts
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()

  static startMeasure(name: string): void {
    if (typeof window === 'undefined') return
    performance.mark(`${name}-start`)
  }

  static endMeasure(name: string): number | null {
    if (typeof window === 'undefined') return null

    try {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
      
      const measure = performance.getEntriesByName(name)[0]
      const duration = measure.duration

      // Store metric
      if (!this.metrics.has(name)) {
        this.metrics.set(name, [])
      }
      this.metrics.get(name)!.push(duration)

      // Clean up
      performance.clearMarks(`${name}-start`)
      performance.clearMarks(`${name}-end`)
      performance.clearMeasures(name)

      return duration
    } catch {
      return null
    }
  }

  static getAverage(name: string): number {
    const metrics = this.metrics.get(name)
    if (!metrics || metrics.length === 0) return 0
    return metrics.reduce((a, b) => a + b, 0) / metrics.length
  }

  static trackWebVitals(): void {
    if (typeof window === 'undefined') return

    // Track LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      console.log('LCP:', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // Track FID
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime)
      })
    }).observe({ entryTypes: ['first-input'] })

    // Track CLS
    let clsValue = 0
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      console.log('CLS:', clsValue)
    }).observe({ entryTypes: ['layout-shift'] })
  }
}

// Initialize on client
if (typeof window !== 'undefined') {
  PerformanceMonitor.trackWebVitals()
}
```

### Usage

```typescript
// In components
"use client"

import { useEffect } from 'react'
import { PerformanceMonitor } from '@/lib/utils/performance-monitor'

export function MyComponent() {
  useEffect(() => {
    PerformanceMonitor.startMeasure('MyComponent-render')
    
    return () => {
      const duration = PerformanceMonitor.endMeasure('MyComponent-render')
      console.log(`MyComponent rendered in ${duration}ms`)
    }
  }, [])

  return <div>Content</div>
}
```

---

## 10. Best Practices

### 1. Bundle Size Optimization

- Use `@next/bundle-analyzer` to identify large dependencies
- Remove unused dependencies
- Consider code splitting for large libraries
- Use dynamic imports for heavy components

```bash
npm install --save-dev @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

### 2. Database Optimization

- Add indexes on frequently queried columns
- Use database connection pooling
- Optimize complex queries
- Use database views for complex joins

### 3. CDN Configuration

- Enable CDN caching for static assets
- Configure proper cache headers
- Use CDN for images
- Enable compression

### 4. Service Worker Optimization

- Optimize PWA caching strategy
- Cache API responses appropriately
- Implement offline fallbacks

### 5. Performance Targets

Aim for these Core Web Vitals:

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Total Blocking Time (TBT)**: < 200ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Speed Index**: < 3.4s

### 6. Monitoring & Analytics

- Integrate performance monitoring (e.g., Vercel Analytics)
- Set up error tracking (e.g., Sentry)
- Monitor Core Web Vitals
- Track API response times

### 7. Quick Wins Checklist

- ✅ Enable compression
- ✅ Optimize fonts (use `next/font`)
- ✅ Lazy load images
- ✅ Code splitting for non-critical components
- ✅ Multi-layer caching strategy
- ✅ Use Server Components by default
- ✅ Configure proper cache headers
- ✅ Optimize React Query configuration
- ✅ Memoize context values
- ✅ Disable production source maps

---

## Implementation Checklist

Use this checklist when optimizing a Next.js application:

### Configuration
- [ ] Configure `optimizePackageImports` for large packages
- [ ] Externalize server-only packages
- [ ] Disable production source maps
- [ ] Enable CSS optimization
- [ ] Configure image optimization
- [ ] Set up cache headers
- [ ] Configure security headers

### Code Splitting
- [ ] Lazy load non-critical components
- [ ] Lazy load below-the-fold content
- [ ] Use dynamic imports for heavy libraries
- [ ] Split routes appropriately

### Caching
- [ ] Configure React Query cache times
- [ ] Implement browser cache (localStorage)
- [ ] Set up memory cache
- [ ] Configure Next.js fetch caching
- [ ] Set appropriate revalidation times

### Images
- [ ] Replace all `<img>` with Next.js `Image`
- [ ] Configure responsive images
- [ ] Add blur placeholders
- [ ] Handle image errors

### Server Components
- [ ] Use Server Components by default
- [ ] Only mark components as client when needed
- [ ] Fetch data in Server Components
- [ ] Pass data to Client Components

### Context Providers
- [ ] Memoize context values
- [ ] Use `useCallback` for functions
- [ ] Use `useMemo` for computed values
- [ ] Optimize provider nesting

### Monitoring
- [ ] Set up performance monitoring
- [ ] Track Core Web Vitals
- [ ] Monitor API response times
- [ ] Set up error tracking

---

## Resources

- [Next.js Performance Documentation](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [React Query Performance Guide](https://tanstack.com/query/latest/docs/react/guides/performance)
- [Next.js Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)

---

**Last Updated**: 2025-01-27
**Version**: 1.0.0

This guide is based on optimizations implemented in production Next.js applications and can be applied to any Next.js project.

