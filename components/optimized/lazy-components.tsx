/**
 * Lazy-loaded Components
 * Code splitting for better performance
 */

import dynamic from 'next/dynamic'

// Lazy load heavy components
export const LazyAdminDashboard = dynamic(
  () =>
    import('@/app/admin/dashboard-client').then((mod) => mod.AdminDashboardClient),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
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
