# API Hooks Documentation

This directory contains centralized React Query hooks for all API calls in the application. These hooks provide:

- **Automatic caching** with configurable stale times
- **Request deduplication** (multiple components requesting the same data share one request)
- **Automatic refetching** on window focus (production only)
- **Optimistic updates** for mutations
- **Cache invalidation** after mutations

## Available Hooks

### Products

```typescript
import {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '@/hooks/api'

// Get all products with filters
const {
  data: products,
  isLoading,
  error,
} = useProducts({
  category: 'ayurveda',
  featured: true,
  search: 'herbal',
  active: true,
})

// Get single product
const { data: product, isLoading } = useProduct(productId)

// Create product (admin only)
const createProduct = useCreateProduct()
createProduct.mutate(
  {
    name: 'Product Name',
    price: 99.99,
    // ... other fields
  },
  {
    onSuccess: (product) => {
      console.log('Product created:', product)
    },
  }
)

// Update product (admin only)
const updateProduct = useUpdateProduct()
updateProduct.mutate({
  id: productId,
  name: 'Updated Name',
  price: 149.99,
})

// Delete product (admin only)
const deleteProduct = useDeleteProduct()
deleteProduct.mutate(productId, {
  onSuccess: () => {
    console.log('Product deleted')
  },
})
```

### Blog Posts

```typescript
import {
  useBlogPosts,
  useBlogPost,
  useCreateBlogPost,
  useBlogCategories,
  useBlogTags,
} from '@/hooks/api'

// Get all blog posts
const {
  data: { posts, total },
  isLoading,
} = useBlogPosts({
  status: 'published',
  category: 'health',
  limit: 10,
  offset: 0,
})

// Get single blog post by ID
const { data: post, isLoading } = useBlogPost(postId)

// Get blog post by slug
const { data: post, isLoading } = useBlogPostBySlug(slug)

// Create blog post (admin only)
const createPost = useCreateBlogPost()
createPost.mutate({
  title: 'Post Title',
  slug: 'post-slug',
  content: '<p>Content</p>',
  status: 'published',
})

// Get categories and tags
const { data: categories } = useBlogCategories()
const { data: tags } = useBlogTags()
```

### Orders

```typescript
import {
  useOrders,
  useOrder,
  useCreateOrder,
  useUpdateOrder,
} from '@/hooks/api'

// Get all orders
const { data: orders, isLoading } = useOrders({ status: 'pending' })

// Get single order
const { data: order, isLoading } = useOrder(orderId)

// Create order
const createOrder = useCreateOrder()
createOrder.mutate({
  items: [
    {
      product_id: '123',
      name: 'Product Name',
      price: 99.99,
      quantity: 2,
    },
  ],
  shipping_address: {
    /* address object */
  },
  subtotal: 199.98,
  tax_amount: 20,
  shipping_amount: 10,
})

// Update order status
const updateOrder = useUpdateOrder()
updateOrder.mutate({
  id: orderId,
  status: 'confirmed',
})
```

### Categories

```typescript
import { useProductCategories, useProductCategory } from '@/hooks/api'

// Get all product categories
const { data: categories, isLoading } = useProductCategories()

// Get single category
const { data: category, isLoading } = useProductCategory(categoryId)
```

## Authentication Context

```typescript
import { useAuth } from "@/contexts/auth-context"

function MyComponent() {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please sign in</div>

  return (
    <div>
      <p>Welcome, {user?.name}</p>
      {isAdmin && <p>Admin Dashboard</p>}
    </div>
  )
}
```

## Best Practices

1. **Use hooks in client components only** - These hooks use React Query which requires client-side rendering
2. **Handle loading and error states** - Always check `isLoading` and `error` before using data
3. **Use mutations with callbacks** - Provide `onSuccess` and `onError` callbacks for better UX
4. **Leverage cache** - React Query automatically caches data, so multiple components using the same hook share the same data
5. **Invalidate queries after mutations** - The hooks automatically invalidate related queries, but you can manually invalidate if needed

## Cache Configuration

Default cache settings:

- **Stale time**: 5 minutes (data is considered fresh)
- **Cache time**: 10 minutes (data stays in cache)
- **Retry**: 1 time for queries, 0 for mutations
- **Refetch on window focus**: Only in production

You can override these per-query:

```typescript
const { data } = useProducts(undefined, {
  staleTime: 1000 * 60 * 10, // 10 minutes
  refetchOnWindowFocus: false,
})
```

## Error Handling

All hooks throw `ApiError` which includes:

- `message`: Error message
- `status`: HTTP status code
- `data`: Additional error data

```typescript
const { data, error } = useProducts()

if (error) {
  if (error.status === 404) {
    // Handle not found
  } else if (error.status === 401) {
    // Handle unauthorized
  }
}
```









