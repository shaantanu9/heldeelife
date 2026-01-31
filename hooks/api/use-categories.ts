/**
 * Categories API Hooks
 * Centralized hooks for category-related API calls with caching
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/query-keys'

// Types
export interface ProductCategory {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
  image?: string
  created_at?: string
  updated_at?: string
}

// Get product categories
export function useProductCategories() {
  return useQuery({
    queryKey: queryKeys.productCategories.lists(),
    queryFn: async () => {
      const response = await apiClient.get<{ categories: ProductCategory[] }>(
        '/products/categories'
      )
      return response.categories
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (categories don't change often)
  })
}

// Get single product category by ID
export function useProductCategory(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.productCategories.detail(id!),
    queryFn: async () => {
      const response = await apiClient.get<ProductCategory>(
        `/products/categories/${id}`
      )
      return response
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}









