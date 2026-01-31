/**
 * Query Keys Factory
 * Centralized query key management for React Query
 * Ensures consistent cache key structure across the app
 */

export const queryKeys = {
  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: {
      category?: string
      featured?: boolean
      search?: string
      active?: boolean
    }) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },

  // Product Categories
  productCategories: {
    all: ['product-categories'] as const,
    lists: () => [...queryKeys.productCategories.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.productCategories.lists(), filters] as const,
    details: () => [...queryKeys.productCategories.all, 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.productCategories.details(), id] as const,
  },

  // Blog Posts
  blogPosts: {
    all: ['blog-posts'] as const,
    lists: () => [...queryKeys.blogPosts.all, 'list'] as const,
    list: (filters?: {
      status?: string
      category?: string
      tag?: string
      limit?: number
      offset?: number
    }) => [...queryKeys.blogPosts.lists(), filters] as const,
    details: () => [...queryKeys.blogPosts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.blogPosts.details(), id] as const,
    bySlug: (slug: string) =>
      [...queryKeys.blogPosts.details(), 'slug', slug] as const,
  },

  // Blog Categories
  blogCategories: {
    all: ['blog-categories'] as const,
    lists: () => [...queryKeys.blogCategories.all, 'list'] as const,
  },

  // Blog Tags
  blogTags: {
    all: ['blog-tags'] as const,
    lists: () => [...queryKeys.blogTags.all, 'list'] as const,
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters?: { status?: string }) =>
      [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },

  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },

  // Reviews
  reviews: {
    all: ['reviews'] as const,
    lists: () => [...queryKeys.reviews.all, 'list'] as const,
    list: (filters?: { product_id?: string; user_id?: string }) =>
      [...queryKeys.reviews.lists(), filters] as const,
    details: () => [...queryKeys.reviews.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reviews.details(), id] as const,
    byProduct: (productId: string) =>
      [...queryKeys.reviews.lists(), 'product', productId] as const,
  },

  // Wishlist
  wishlist: {
    all: ['wishlist'] as const,
    lists: () => [...queryKeys.wishlist.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.wishlist.all, 'detail', id] as const,
    check: (productId: string) =>
      [...queryKeys.wishlist.all, 'check', productId] as const,
  },

  // Coupons
  coupons: {
    all: ['coupons'] as const,
    lists: () => [...queryKeys.coupons.all, 'list'] as const,
    list: (filters?: { active?: boolean; code?: string }) =>
      [...queryKeys.coupons.lists(), filters] as const,
    details: () => [...queryKeys.coupons.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.coupons.details(), id] as const,
    byCode: (code: string) =>
      [...queryKeys.coupons.details(), 'code', code] as const,
  },

  // Addresses
  addresses: {
    all: ['addresses'] as const,
    lists: () => [...queryKeys.addresses.all, 'list'] as const,
    details: () => [...queryKeys.addresses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.addresses.details(), id] as const,
  },

  // Payments
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
    byOrder: (orderId: string) =>
      [...queryKeys.payments.lists(), 'order', orderId] as const,
  },

  // Analytics (for admin)
  analytics: {
    all: ['analytics'] as const,
    sales: (filters?: { startDate?: string; endDate?: string }) =>
      [...queryKeys.analytics.all, 'sales', filters] as const,
    products: (filters?: { startDate?: string; endDate?: string }) =>
      [...queryKeys.analytics.all, 'products', filters] as const,
    orders: (filters?: { startDate?: string; endDate?: string }) =>
      [...queryKeys.analytics.all, 'orders', filters] as const,
  },
} as const
