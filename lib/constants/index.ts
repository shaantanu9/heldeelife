/**
 * App-wide Constants
 * Centralized configuration and constants for the application
 */

// App Configuration
export const APP_CONFIG = {
  name: 'HeldeeLife',
  description: 'Ayurveda and Modern Medicine E-commerce Platform',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  version: '0.1.0',
} as const

// API Configuration
export const API_CONFIG = {
  baseURL: '/api',
  timeout: 30000, // 30 seconds
  retryAttempts: 1,
} as const

// Cache Times (in milliseconds)
export const CACHE_TIMES = {
  // Short-lived data (frequently changing)
  orders: 1000 * 60 * 2, // 2 minutes - orders change frequently
  orderDetail: 1000 * 60 * 1, // 1 minute - individual orders change often
  cart: 1000 * 60 * 5, // 5 minutes
  abandonedCarts: 1000 * 60 * 3, // 3 minutes - abandoned carts update frequently
  returns: 1000 * 60 * 2, // 2 minutes - return status changes
  refunds: 1000 * 60 * 2, // 2 minutes - refund status changes

  // Medium-lived data (moderately changing)
  products: 1000 * 60 * 5, // 5 minutes - products don't change often
  productDetail: 1000 * 60 * 5, // 5 minutes
  blogPosts: 1000 * 60 * 5, // 5 minutes
  reviews: 1000 * 60 * 10, // 10 minutes - reviews are relatively static
  loyaltyPoints: 1000 * 60 * 5, // 5 minutes - points update on purchases
  loyaltyRewards: 1000 * 60 * 30, // 30 minutes - rewards rarely change
  analytics: 1000 * 60 * 5, // 5 minutes - analytics update periodically

  // Long-lived data (rarely changing)
  categories: 1000 * 60 * 30, // 30 minutes
  tags: 1000 * 60 * 30, // 30 minutes
  static: 1000 * 60 * 60, // 1 hour
  coupons: 1000 * 60 * 10, // 10 minutes - coupons don't change often

  // User data
  users: 1000 * 60 * 10, // 10 minutes - user list doesn't change often
  userDetail: 1000 * 60 * 5, // 5 minutes - individual user data
  user: 1000 * 60 * 15, // 15 minutes
  session: 1000 * 60 * 5, // 5 minutes
} as const

// Next.js Revalidation Times (in seconds)
export const REVALIDATE_TIMES = {
  // Short revalidation (frequently changing)
  orders: 120, // 2 minutes
  orderDetail: 60, // 1 minute
  abandonedCarts: 180, // 3 minutes
  returns: 120, // 2 minutes
  refunds: 120, // 2 minutes

  // Medium revalidation (moderately changing)
  products: 300, // 5 minutes
  productDetail: 300, // 5 minutes
  blogPosts: 300, // 5 minutes
  reviews: 600, // 10 minutes
  loyaltyPoints: 300, // 5 minutes
  analytics: 300, // 5 minutes

  // Long revalidation (rarely changing)
  categories: 1800, // 30 minutes
  tags: 1800, // 30 minutes
  coupons: 600, // 10 minutes
  loyaltyRewards: 1800, // 30 minutes
  users: 600, // 10 minutes
  userDetail: 300, // 5 minutes
} as const

// Route Paths
export const ROUTES = {
  // Public routes
  home: '/',
  shop: '/shop',
  blog: '/blog',
  about: '/about',
  service: '/service',
  resource: '/resource',
  search: '/search',

  // Product routes
  product: (id: string) => `/products/${id}`,

  // Blog routes
  blogPost: (slug: string) => `/blog/${slug}`,
  insight: (id: string) => `/insights/${id}`,

  // Auth routes
  signin: '/auth/signin',
  signup: '/auth/signup',

  // User routes
  profile: '/profile',
  profileOrders: '/profile/orders',
  profileAddresses: '/profile/addresses',
  cart: '/cart',
  checkout: '/checkout',

  // Admin routes
  admin: '/admin',
  adminDashboard: '/admin',
  adminProducts: '/admin/products',
  adminOrders: '/admin/orders',
  adminBlog: '/admin/blog',
  adminUsers: '/admin/users',
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  cart: 'heldeelife-cart',
  wishlist: 'heldeelife-wishlist',
  theme: 'heldeelife-theme',
  preferences: 'heldeelife-preferences',
  recentlyViewed: 'heldeelife-recently-viewed',
} as const

// Pagination
export const PAGINATION = {
  defaultPageSize: 12,
  maxPageSize: 100,
  defaultOffset: 0,
} as const

// Order Status
export const ORDER_STATUS = {
  pending: 'pending',
  confirmed: 'confirmed',
  processing: 'processing',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  refunded: 'refunded',
} as const

// Payment Status
export const PAYMENT_STATUS = {
  pending: 'pending',
  paid: 'paid',
  failed: 'failed',
  refunded: 'refunded',
} as const

// Payment Methods
export const PAYMENT_METHODS = {
  cod: 'cod',
  razorpay: 'razorpay',
  stripe: 'stripe',
  upi: 'upi',
} as const

// User Roles
export const USER_ROLES = {
  user: 'user',
  admin: 'admin',
} as const

// Product Status
export const PRODUCT_STATUS = {
  active: 'active',
  inactive: 'inactive',
  outOfStock: 'out_of_stock',
  discontinued: 'discontinued',
} as const

// Blog Post Status
export const BLOG_STATUS = {
  draft: 'draft',
  published: 'published',
  archived: 'archived',
} as const

// Image Configuration
export const IMAGE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  defaultQuality: 85,
  thumbnailSize: 300,
  mediumSize: 800,
  largeSize: 1200,
} as const

// Form Validation
export const VALIDATION = {
  minPasswordLength: 8,
  maxPasswordLength: 128,
  minNameLength: 2,
  maxNameLength: 100,
  maxDescriptionLength: 5000,
  maxTitleLength: 200,
  phoneRegex:
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
  emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const

// Debounce Times (in milliseconds)
export const DEBOUNCE = {
  search: 300,
  input: 500,
  resize: 150,
  scroll: 100,
} as const

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// Error Messages
export const ERROR_MESSAGES = {
  generic: 'Something went wrong. Please try again.',
  network: 'Network error. Please check your connection.',
  unauthorized: 'You are not authorized to perform this action.',
  notFound: 'The requested resource was not found.',
  validation: 'Please check your input and try again.',
  server: 'Server error. Please try again later.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  saved: 'Saved successfully!',
  created: 'Created successfully!',
  updated: 'Updated successfully!',
  deleted: 'Deleted successfully!',
  addedToCart: 'Added to cart!',
  orderPlaced: 'Order placed successfully!',
} as const

// Business Configuration
export const BUSINESS_CONFIG = {
  taxRate: 0.18,
  freeShippingThreshold: 500,
  currency: 'INR',
  currencySymbol: '₹',
} as const

// Feature Flags (for gradual rollouts)
export const FEATURES = {
  wishlist: true,
  reviews: true,
  coupons: true,
  recommendations: false,
  analytics: false,
  emailNotifications: false,
} as const

