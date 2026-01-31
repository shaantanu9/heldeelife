# Next.js Performance Optimization Guide

This document outlines all the performance optimizations implemented in the heldeelife application using Next.js 14 App Router features.

## Overview

The application now uses:

- **Server Components** by default for better performance
- **Incremental Static Regeneration (ISR)** for dynamic content
- **Next.js fetch caching** with proper revalidation
- **Route segment config** for optimal caching strategies
- **Suspense boundaries** for better loading states
- **Static generation** for popular content

## Key Optimizations

### 1. Server Components

**Before**: Client components fetching data on mount

```typescript
"use client"
export default function ProductPage() {
  const [product, setProduct] = useState(null)
  useEffect(() => {
    fetch(`/api/products/${id}`).then(...)
  }, [])
}
```

**After**: Server components with direct data fetching

```typescript
export default async function ProductPage({ params }) {
  const product = await getProduct(id) // Server-side fetch
  return <ProductClient product={product} />
}
```

**Benefits**:

- No client-side JavaScript for data fetching
- Faster initial page load
- Better SEO
- Reduced bundle size

### 2. Route Segment Config

Added to pages and API routes for optimal caching:

```typescript
// Pages
export const revalidate = 60 // ISR: Revalidate every 60 seconds
export const dynamic = 'force-dynamic' // Allow dynamic rendering

// API Routes
export const revalidate = 60
export const dynamic = 'force-dynamic'
```

**Revalidation Strategy**:

- **Products**: 60 seconds (frequent updates)
- **Categories**: 3600 seconds (rarely change)
- **Blog Posts**: 60 seconds (new content)
- **Orders**: 0 seconds (user-specific, no cache)

### 3. Next.js Fetch Caching

Server-side data fetching uses React `cache()` for request deduplication:

```typescript
// lib/api/server.ts
export const getProduct = cache(async (id: string) => {
  // This function is memoized per request
  const { data } = await supabaseAdmin.from("products")...
  return data
})
```

**Benefits**:

- Automatic request deduplication
- Shared cache across components in same request
- Reduced database queries

### 4. HTTP Cache Headers

API routes set proper cache headers:

```typescript
const response = NextResponse.json({ products })
response.headers.set(
  'Cache-Control',
  'public, s-maxage=60, stale-while-revalidate=300'
)
return response
```

**Cache Headers**:

- `s-maxage=60`: Cache for 60 seconds in CDN
- `stale-while-revalidate=300`: Serve stale content for 5 minutes while revalidating
- `public`: Allow caching in CDN and browsers

### 5. Suspense Boundaries

Added Suspense for better loading states:

```typescript
<Suspense fallback={<ShopLoading />}>
  <ShopContent />
</Suspense>
```

**Benefits**:

- Progressive page rendering
- Better user experience
- Streaming SSR support

### 6. Static Generation

Popular content is pre-rendered at build time:

```typescript
// app/products/[id]/generate-static-params.ts
export async function generateStaticParams() {
  // Pre-render top 20 featured products
  const products = await getFeaturedProducts()
  return products.map((p) => ({ id: p.id }))
}
```

**Benefits**:

- Instant page loads for popular products
- Reduced server load
- Better SEO

### 7. Image Optimization

Next.js Image component with optimized config:

```typescript
// next.config.js
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
}
```

**Benefits**:

- Automatic format optimization (AVIF, WebP)
- Responsive images
- Lazy loading
- Reduced bandwidth

### 8. Build Optimizations

```typescript
// next.config.js
swcMinify: true, // Faster builds
compress: true, // Gzip compression
optimizeFonts: true, // Font optimization
reactStrictMode: true, // Better React performance
```

## File Structure

### Server Components

- `app/products/[id]/page.tsx` - Server component with SSR
- `app/shop/page.tsx` - Server component with ISR
- `app/page.tsx` - Homepage with server components

### Client Components (Interactive Only)

- `app/products/[id]/product-client.tsx` - Add to cart functionality
- `app/shop/shop-client.tsx` - Search and filters
- `components/sections/products-client.tsx` - Product carousel

### Server Utilities

- `lib/api/server.ts` - Server-side data fetching with caching

### API Routes

- All API routes have route segment config
- Proper cache headers for public endpoints
- No caching for user-specific data (orders)

## Caching Strategy

### Public Content (Cached)

- ✅ Products list: 60s revalidation
- ✅ Product details: 60s revalidation
- ✅ Categories: 3600s revalidation
- ✅ Blog posts: 60s revalidation

### User-Specific Content (No Cache)

- ❌ Orders: Dynamic, no cache
- ❌ User profile: Dynamic, no cache
- ❌ Cart: Client-side only

### Static Content (Pre-rendered)

- ✅ Featured products: Static generation
- ✅ Blog post slugs: Static generation with ISR

## Performance Metrics

Expected improvements:

- **First Contentful Paint (FCP)**: 40-60% faster
- **Largest Contentful Paint (LCP)**: 50-70% faster
- **Time to Interactive (TTI)**: 30-50% faster
- **Bundle Size**: 20-30% smaller (less client JS)
- **Server Load**: 60-80% reduction (caching)

## Best Practices

### 1. Use Server Components by Default

Only use `"use client"` when you need:

- Browser APIs (localStorage, window)
- Event handlers (onClick, onChange)
- React hooks (useState, useEffect)
- Context providers

### 2. Fetch Data on the Server

```typescript
// ✅ Good: Server component
export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}

// ❌ Bad: Client component fetching
"use client"
export default function Page() {
  const [data, setData] = useState(null)
  useEffect(() => { fetchData().then(setData) }, [])
}
```

### 3. Use Suspense for Loading States

```typescript
<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>
```

### 4. Set Appropriate Revalidation Times

- Frequently changing: 60 seconds
- Rarely changing: 3600+ seconds
- User-specific: 0 seconds (no cache)

### 5. Use generateStaticParams for Popular Content

Pre-render the most visited pages at build time.

## Monitoring

To monitor performance:

1. Use Next.js Analytics
2. Check Lighthouse scores
3. Monitor Core Web Vitals
4. Track API response times
5. Monitor cache hit rates

## Future Optimizations

1. **Edge Runtime**: Move API routes to edge for lower latency
2. **Partial Prerendering**: Enable when stable
3. **React Server Components Streaming**: Already enabled
4. **Image CDN**: Use ImageKit or similar for better image delivery
5. **Database Connection Pooling**: Optimize Supabase connections

## Resources

- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Web Vitals](https://web.dev/vitals/)

