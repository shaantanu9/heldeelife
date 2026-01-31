# API Hooks & State Management Setup

This document describes the centralized API hooks and state management system implemented for the heldeelife application.

## Overview

The application now uses **React Query (TanStack Query)** for all API calls, providing:

- Automatic caching with configurable stale times
- Request deduplication
- Optimistic updates
- Automatic cache invalidation
- Better error handling
- Reduced boilerplate code

## Architecture

### Core Components

1. **API Client** (`lib/api/client.ts`)
   - Centralized HTTP client with error handling
   - Consistent request/response handling
   - Type-safe API calls

2. **Query Keys Factory** (`lib/api/query-keys.ts`)
   - Centralized query key management
   - Ensures consistent cache key structure
   - Enables easy cache invalidation

3. **Query Configuration** (`lib/api/config.ts`)
   - Default React Query settings
   - Cache and stale time configuration
   - Retry logic

4. **Custom Hooks** (`hooks/api/`)
   - `use-products.ts` - Product-related hooks
   - `use-blog.ts` - Blog post hooks
   - `use-orders.ts` - Order hooks
   - `use-categories.ts` - Category hooks

5. **Context Providers**
   - `AuthProvider` - User authentication state
   - `CartProvider` - Shopping cart state (existing, enhanced)
   - `QueryClientProvider` - React Query provider

## Installation

React Query has been installed:

```bash
npm install @tanstack/react-query
```

## Setup

The providers are configured in `components/providers.tsx`:

```typescript
<QueryClientProvider client={queryClient}>
  <SessionProvider>
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  </SessionProvider>
</QueryClientProvider>
```

## Available Hooks

### Products

- `useProducts(filters?)` - Get all products
- `useProduct(id)` - Get single product
- `useCreateProduct()` - Create product (admin)
- `useUpdateProduct()` - Update product (admin)
- `useDeleteProduct()` - Delete product (admin)

### Blog Posts

- `useBlogPosts(filters?)` - Get all blog posts
- `useBlogPost(id)` - Get single blog post by ID
- `useBlogPostBySlug(slug)` - Get blog post by slug
- `useCreateBlogPost()` - Create blog post (admin)
- `useUpdateBlogPost()` - Update blog post (admin)
- `useDeleteBlogPost()` - Delete blog post (admin)
- `useBlogCategories()` - Get blog categories
- `useBlogTags()` - Get blog tags

### Orders

- `useOrders(filters?)` - Get all orders
- `useOrder(id)` - Get single order
- `useCreateOrder()` - Create order
- `useUpdateOrder()` - Update order status

### Categories

- `useProductCategories()` - Get product categories
- `useProductCategory(id)` - Get single category

### Authentication

- `useAuth()` - Get current user, authentication status, and admin status

## Usage Examples

### Fetching Data

```typescript
import { useProducts } from "@/hooks/api"

function ProductsList() {
  const { data: products, isLoading, error } = useProducts({
    category: "ayurveda",
    featured: true
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

### Mutations

```typescript
import { useCreateProduct } from "@/hooks/api"
import { toast } from "sonner"

function CreateProductForm() {
  const createProduct = useCreateProduct()

  const handleSubmit = (data) => {
    createProduct.mutate(data, {
      onSuccess: (product) => {
        toast.success("Product created!")
        // Product is automatically added to cache
      },
      onError: (error) => {
        toast.error(error.message)
      }
    })
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### Authentication

```typescript
import { useAuth } from "@/contexts/auth-context"

function ProtectedComponent() {
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please sign in</div>

  return (
    <div>
      <p>Welcome, {user?.name}</p>
      {isAdmin && <AdminPanel />}
    </div>
  )
}
```

## Cache Configuration

Default settings:

- **Stale Time**: 5 minutes (data is considered fresh)
- **Cache Time**: 10 minutes (data stays in cache)
- **Retry**: 1 time for queries, 0 for mutations
- **Refetch on Window Focus**: Only in production

You can override per-query:

```typescript
const { data } = useProducts(undefined, {
  staleTime: 1000 * 60 * 10, // 10 minutes
  refetchOnWindowFocus: false,
})
```

## Cache Invalidation

Hooks automatically invalidate related queries after mutations. For example:

- Creating a product invalidates the products list
- Updating a product updates the cache for that specific product
- Deleting a product removes it from cache

You can manually invalidate:

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/query-keys'

const queryClient = useQueryClient()

// Invalidate all products
queryClient.invalidateQueries({
  queryKey: queryKeys.products.lists(),
})

// Invalidate specific product
queryClient.invalidateQueries({
  queryKey: queryKeys.products.detail(productId),
})
```

## Error Handling

All API errors are wrapped in `ApiError`:

```typescript
const { data, error } = useProducts()

if (error) {
  // error.status - HTTP status code
  // error.message - Error message
  // error.data - Additional error data
}
```

## Migration Guide

See `hooks/api/MIGRATION_EXAMPLE.md` for detailed migration examples.

### Quick Migration Steps

1. Replace `useState` + `useEffect` + `fetch` with React Query hooks
2. Remove manual loading/error state management
3. Use `isLoading` and `error` from hooks
4. Update filters to use query parameters in hooks

## File Structure

```
lib/api/
├── client.ts          # API client
├── query-keys.ts     # Query keys factory
└── config.ts         # React Query configuration

hooks/api/
├── use-products.ts   # Product hooks
├── use-blog.ts       # Blog hooks
├── use-orders.ts     # Order hooks
├── use-categories.ts # Category hooks
├── index.ts          # Exports
├── README.md         # Documentation
└── MIGRATION_EXAMPLE.md # Migration guide

contexts/
├── auth-context.tsx  # Auth context provider
└── cart-context.tsx  # Cart context (existing)
```

## Benefits

1. **Performance**: Automatic caching reduces API calls
2. **Developer Experience**: Less boilerplate, better TypeScript support
3. **User Experience**: Optimistic updates, better loading states
4. **Maintainability**: Centralized API logic, easier to test
5. **Scalability**: Easy to add new endpoints and hooks

## Next Steps

1. Migrate existing components to use the new hooks
2. Add more specific hooks as needed (e.g., `useFeaturedProducts`)
3. Consider adding optimistic updates for better UX
4. Add React Query DevTools for development (optional)

## Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [API Hooks README](./hooks/api/README.md)
- [Migration Examples](./hooks/api/MIGRATION_EXAMPLE.md)

