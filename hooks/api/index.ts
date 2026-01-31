/**
 * Centralized API Hooks Export
 * Export all API hooks from a single location
 */

// Products
export {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  type Product,
  type ProductFilters,
  type CreateProductInput,
  type UpdateProductInput,
} from './use-products'

// Blog
export {
  useBlogPosts,
  useBlogPost,
  useBlogPostBySlug,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
  useBlogCategories,
  useBlogTags,
  type BlogPostFilters,
} from './use-blog'

// Orders
export {
  useOrders,
  useOrder,
  useCreateOrder,
  useUpdateOrder,
  type Order,
  type OrderItem,
  type CreateOrderInput,
  type OrderFilters,
} from './use-orders'

// Categories
export {
  useProductCategories,
  useProductCategory,
  type ProductCategory,
} from './use-categories'









