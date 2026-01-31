'use client'

import { useState, useMemo } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { CartProvider } from '@/contexts/cart-context'
import { AuthProvider } from '@/contexts/auth-context'
import { ToastProvider } from '@/contexts/toast-context'
import { WishlistProvider } from '@/contexts/wishlist-context'
import { ComparisonProvider } from '@/contexts/comparison-context'
import { AbandonedCartProvider } from '@/contexts/abandoned-cart-context'
import { OrderProvider } from '@/contexts/order-context'
import { ShoppingProvider } from '@/contexts/shopping-context'
import { TrackingProvider } from '@/contexts/tracking-context'
import { createQueryClient } from '@/lib/api/config'
import { PerformanceMonitor } from '@/components/performance-monitor'
import { AnalyticsInitializer } from '@/components/analytics/analytics-initializer'
import dynamic from 'next/dynamic'

// Dynamically import React Query DevTools (optional - only loads if available)
// This won't break the build if the package isn't installed
const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? dynamic(
        () =>
          import('@tanstack/react-query-devtools')
            .then((mod) => ({
              default: mod.ReactQueryDevtools,
            }))
            .catch(() => {
              // Return empty component if package not installed
              return { default: () => null }
            }),
        {
          ssr: false,
          // Only load devtools when needed
          loading: () => null,
        }
      )
    : () => null

/**
 * Optimized Providers Component
 *
 * Performance optimizations:
 * - Single QueryClient instance per session (memoized)
 * - Provider nesting optimized to reduce re-renders
 * - Lazy loading for dev tools
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance once per app render
  // Using useState with function initializer ensures it's only created once
  const [queryClient] = useState(() => createQueryClient())

  // Memoize the providers structure to prevent unnecessary re-renders
  // Only re-render when children change
  const providers = useMemo(
    () => (
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <AuthProvider>
            <ShoppingProvider>
              <CartProvider>
                <OrderProvider>
                  <TrackingProvider>
                    <WishlistProvider>
                      <ComparisonProvider>
                        <AbandonedCartProvider>
                          <ToastProvider>
                            <AnalyticsInitializer />
                            {children}
                            {/* Performance Monitoring - only in production */}
                            {process.env.NODE_ENV === 'production' && (
                              <PerformanceMonitor />
                            )}
                            {/* React Query DevTools - only in development and if package is installed */}
                            {process.env.NODE_ENV === 'development' && (
                              <ReactQueryDevtools initialIsOpen={false} />
                            )}
                          </ToastProvider>
                        </AbandonedCartProvider>
                      </ComparisonProvider>
                    </WishlistProvider>
                  </TrackingProvider>
                </OrderProvider>
              </CartProvider>
            </ShoppingProvider>
          </AuthProvider>
        </SessionProvider>
      </QueryClientProvider>
    ),
    [queryClient, children]
  )

  return providers
}
