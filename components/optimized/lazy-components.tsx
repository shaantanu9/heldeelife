/**
 * Lazy-loaded Components
 * Code splitting for better performance
 */

import dynamic from 'next/dynamic'

// Lazy load heavy components
export const LazyProductModal = dynamic(
  () =>
    import('@/components/products/product-modal').then(
      (mod) => mod.ProductModal
    ),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
    ssr: false,
  }
)

export const LazyImageGallery = dynamic(
  () =>
    import('@/components/products/image-gallery').then(
      (mod) => mod.ImageGallery
    ),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded" />,
  }
)

export const LazyBlogEditor = dynamic(
  () => import('@/components/blog/blog-editor').then((mod) => mod.BlogEditor),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded" />,
    ssr: false,
  }
)

export const LazyAdminDashboard = dynamic(
  () =>
    import('@/app/admin/dashboard-client').then((mod) => mod.DashboardClient),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
  }
)

export const LazyChart = dynamic(
  () => import('@/components/charts/chart').then((mod) => mod.Chart),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
    ssr: false,
  }
)

// Lazy load modals and dialogs
export const LazyDialog = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.Dialog),
  {
    ssr: false,
  }
)

export const LazySheet = dynamic(
  () => import('@/components/ui/sheet').then((mod) => mod.Sheet),
  {
    ssr: false,
  }
)

// Lazy load forms
export const LazyProductForm = dynamic(
  () =>
    import('@/components/admin/products/product-form').then(
      (mod) => mod.ProductForm
    ),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded" />,
    ssr: false,
  }
)

export const LazyBlogForm = dynamic(
  () => import('@/components/admin/blog/blog-form').then((mod) => mod.BlogForm),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded" />,
    ssr: false,
  }
)









