# Performance Optimization Setup

This document outlines all the hooks, constants, context providers, and caching optimizations that have been implemented to make the app run as fast as possible.

## 📦 What Was Created

### 1. Constants (`lib/constants/index.ts`)

Centralized app-wide constants including:

- **APP_CONFIG**: App name, description, URL
- **API_CONFIG**: API base URL, timeout, retry attempts
- **CACHE_TIMES**: Optimized cache durations for different data types
- **ROUTES**: All application routes with helper functions
- **STORAGE_KEYS**: LocalStorage key constants
- **PAGINATION**: Default pagination settings
- **ORDER_STATUS, PAYMENT_STATUS, USER_ROLES**: Status and role constants
- **IMAGE_CONFIG**: Image upload configuration
- **VALIDATION**: Form validation rules
- **DEBOUNCE**: Debounce timing constants
- **BREAKPOINTS**: Responsive breakpoints
- **ERROR_MESSAGES, SUCCESS_MESSAGES**: User-facing messages
- **FEATURES**: Feature flags for gradual rollouts

### 2. Utility Hooks (`hooks/`)

#### `use-debounce.ts`

- `useDebounce`: Debounces a value
- `useDebouncedCallback`: Debounces a callback function

#### `use-local-storage.ts`

- `useLocalStorage`: Syncs state with localStorage with automatic persistence

#### `use-media-query.ts`

- `useMediaQuery`: Detects media query matches
- `useIsMobile`, `useIsTablet`, `useIsDesktop`: Convenience hooks for breakpoints

#### `use-click-outside.ts`

- `useClickOutside`: Detects clicks outside a referenced element

#### `use-intersection-observer.ts`

- `useIntersectionObserver`: Detects when elements enter/leave viewport (for lazy loading)

#### `use-previous.ts`

- `usePrevious`: Returns the previous value of a variable

#### `use-window-size.ts`

- `useWindowSize`: Tracks window dimensions

### 3. Context Providers (`contexts/`)

#### `toast-context.tsx`

- Toast notifications using Sonner
- Methods: `success`, `error`, `info`, `warning`, `loading`, `promise`
- `useToastMessages`: Convenience hook with default messages

#### `wishlist-context.tsx`

- Wishlist state management with localStorage persistence
- Methods: `addToWishlist`, `removeFromWishlist`, `isInWishlist`, `clearWishlist`

#### `index.ts`

- Barrel export for all contexts

### 4. Enhanced Caching (`lib/api/config.ts`)

#### React Query Configuration

- **Optimized stale times**: Different cache times for different data types
- **Exponential backoff**: Smart retry delays
- **Structural sharing**: Prevents unnecessary re-renders
- **Global error handling**: Query and mutation error handlers
- **Development tools**: React Query DevTools in development mode

#### Query Client Utilities

- `prefetch`: Prefetch query data
- `invalidate`: Invalidate and refetch queries
- `setQueryData`: Optimistic updates
- `removeQuery`: Remove from cache
- `clearAll`: Clear all queries

### 5. Query Keys (`lib/api/query-keys.ts`)

Extended with missing query keys:

- **Reviews**: List, detail, by product
- **Wishlist**: List, detail, check
- **Coupons**: List, detail, by code
- **Addresses**: List, detail
- **Payments**: List, detail, by order
- **Analytics**: Sales, products, orders (for admin)

### 6. Performance Utilities (`lib/utils/performance.ts`)

- `memoize`: Memoize function results
- `throttle`: Throttle function execution
- `debounce`: Debounce function execution
- `lazyLoad`: Lazy load React components
- `batchUpdates`: Batch React updates
- `raf`, `cancelRaf`: Request animation frame utilities
- `isClient`, `isServer`: Environment detection

### 7. Cache Utilities (`lib/utils/cache.ts`)

- `MemoryCache`: In-memory cache with TTL
- `createCache`: Cache with automatic expiration
- `prefetchCache`: Prefetch and cache data
- `clearCache`: Clear specific cache entry
- `clearAllCache`: Clear all cache

### 8. Updated Providers (`components/providers.tsx`)

Provider hierarchy:

```
QueryClientProvider
  └── SessionProvider
      └── AuthProvider
          └── CartProvider
              └── WishlistProvider
                  └── ToastProvider
                      └── ReactQueryDevtools (dev only)
```

## 🚀 Performance Optimizations

### 1. Caching Strategy

- **Short-lived data** (2-5 min): Orders, cart
- **Medium-lived data** (5-10 min): Products, blog posts, reviews
- **Long-lived data** (30 min - 1 hour): Categories, tags, static content

### 2. React Query Optimizations

- **Structural sharing**: Prevents unnecessary re-renders
- **Smart refetching**: Only refetches when needed
- **Optimistic updates**: Instant UI updates
- **Query invalidation**: Smart cache invalidation

### 3. Code Splitting

- Lazy loading utilities available
- Dynamic imports for DevTools
- Component-level code splitting ready

### 4. Memory Management

- Automatic cache cleanup
- TTL-based expiration
- Memory cache for frequently accessed data

## 📝 Usage Examples

### Using Constants

```typescript
import { ROUTES, CACHE_TIMES, STORAGE_KEYS } from '@/lib/constants'

// Navigate to product
router.push(ROUTES.product('123'))

// Use cache time
const staleTime = CACHE_TIMES.products

// Access storage
localStorage.getItem(STORAGE_KEYS.cart)
```

### Using Hooks

```typescript
import { useDebounce, useMediaQuery, useLocalStorage } from '@/hooks'

// Debounce search
const debouncedSearch = useDebounce(searchTerm, 300)

// Responsive design
const isMobile = useIsMobile()

// Persistent state
const [theme, setTheme] = useLocalStorage('theme', 'light')
```

### Using Contexts

```typescript
import { useToast, useWishlist, useCart } from '@/contexts'

// Toast notifications
const toast = useToast()
toast.success('Product added!')

// Wishlist
const { addToWishlist, isInWishlist } = useWishlist()

// Cart
const { addToCart, totalItems } = useCart()
```

### Using Cache Utilities

```typescript
import { createCache, prefetchCache } from '@/lib/utils/cache'

// Cache with TTL
const data = await createCache(
  'products',
  () => fetchProducts(),
  1000 * 60 * 5 // 5 minutes
)

// Prefetch
await prefetchCache('categories', () => fetchCategories())
```

## 🔧 Configuration

### Cache Times

Adjust cache times in `lib/constants/index.ts`:

```typescript
export const CACHE_TIMES = {
  products: 1000 * 60 * 5, // 5 minutes
  // ... adjust as needed
}
```

### React Query Config

Modify React Query settings in `lib/api/config.ts`:

```typescript
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: CACHE_TIMES.products,
      // ... other options
    },
  },
}
```

## 🎯 Best Practices

1. **Use query keys consistently**: Always use `queryKeys` factory
2. **Set appropriate stale times**: Match cache times to data freshness needs
3. **Use debouncing**: For search inputs and frequent updates
4. **Lazy load components**: For routes and heavy components
5. **Optimize images**: Use Next.js Image component
6. **Monitor performance**: Use React Query DevTools in development

## 📚 Next Steps

1. **Add more hooks** as needed (e.g., `use-infinite-query`, `use-mutation`)
2. **Implement service workers** for offline support
3. **Add analytics** tracking hooks
4. **Create more contexts** as features grow (e.g., `ThemeContext`, `PreferencesContext`)
5. **Add error boundaries** for better error handling
6. **Implement request deduplication** for identical concurrent requests

## 🔍 Monitoring

- React Query DevTools available in development
- Check browser DevTools for cache hits/misses
- Monitor network tab for unnecessary requests
- Use Performance API for metrics

---

**Last Updated**: 2025-01-27
**Status**: ✅ Complete and Ready for Use

