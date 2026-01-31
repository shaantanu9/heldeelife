/**
 * React Query Configuration
 * Optimized settings for cache, stale time, and retry logic
 */

import {
  QueryClient,
  QueryCache,
  MutationCache,
  type NetworkMode,
} from '@tanstack/react-query'
import { CACHE_TIMES } from '@/lib/constants'

export const queryClientConfig = {
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Global error handling for queries
      console.error(`Query error for ${query.queryKey}:`, error)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      // Global error handling for mutations
      console.error(
        `Mutation error for ${mutation.options.mutationKey}:`,
        error
      )
    },
  }),
  defaultOptions: {
    queries: {
      // Default stale time - data is considered fresh for 5 minutes
      staleTime: CACHE_TIMES.products,
      // Default cache time - data stays in cache for 1 hour (increased for better performance)
      gcTime: 1000 * 60 * 60, // 1 hour (formerly cacheTime)
      // Note: Individual queries should override staleTime based on data freshness needs
      // Retry failed requests 1 time with exponential backoff
      retry: 1,
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus in production only (disabled for better performance)
      refetchOnWindowFocus: false,
      // Don't refetch on mount if data exists and is fresh
      refetchOnMount: false,
      // Don't refetch on reconnect automatically
      refetchOnReconnect: false,
      // Use structural sharing to prevent unnecessary re-renders
      structuralSharing: true,
      // Enable background refetching for stale data (disabled)
      refetchInterval: false as const,
      // Network mode: prefer cached data, fallback to network
      networkMode: 'online' as NetworkMode,
      // Enable placeholder data for better UX
      placeholderData: (previousData: unknown) => previousData,
    },
    mutations: {
      // Retry failed mutations 0 times (fail fast)
      retry: 0,
      // Retry delay for mutations (not used since retry is 0)
      retryDelay: 1000,
      // Network mode for mutations
      networkMode: 'online' as NetworkMode,
    },
  },
}

export function createQueryClient() {
  return new QueryClient(queryClientConfig)
}

/**
 * Query Client Utilities
 * Helper functions for cache management
 */
export const queryClientUtils = {
  /**
   * Prefetch query data
   */
  prefetch: async <T>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    queryFn: () => Promise<T>
  ) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: CACHE_TIMES.products, // Use product cache time for prefetch
    })
  },

  /**
   * Invalidate and refetch queries
   */
  invalidate: (queryClient: QueryClient, queryKey: readonly unknown[]) => {
    return queryClient.invalidateQueries({ queryKey })
  },

  /**
   * Set query data optimistically
   */
  setQueryData: <T>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    updater: T | ((old: T | undefined) => T)
  ) => {
    queryClient.setQueryData(queryKey, updater)
  },

  /**
   * Remove query from cache
   */
  removeQuery: (queryClient: QueryClient, queryKey: readonly unknown[]) => {
    queryClient.removeQueries({ queryKey })
  },

  /**
   * Clear all queries
   */
  clearAll: (queryClient: QueryClient) => {
    queryClient.clear()
  },

  /**
   * Prefetch multiple queries in parallel
   */
  prefetchMultiple: async (
    queryClient: QueryClient,
    queries: Array<{
      queryKey: readonly unknown[]
      queryFn: () => Promise<unknown>
    }>
  ) => {
    await Promise.all(
      queries.map(({ queryKey, queryFn }) =>
        queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: CACHE_TIMES.products,
        })
      )
    )
  },
}
