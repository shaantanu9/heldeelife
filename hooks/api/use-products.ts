/**
 * Products API Hooks
 * Centralized hooks for product-related API calls with caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { performanceMonitor } from '@/lib/utils/performance-monitor'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/query-keys'

// Types
export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  short_description?: string
  price: number
  category_id?: string
  image?: string
  images?: string[]
  benefits?: string[]
  ingredients?: string
  usage_instructions?: string
  storage_instructions?: string
  expiry_info?: string
  manufacturer?: string
  sku?: string
  is_active: boolean
  is_featured: boolean
  inStock?: boolean
  stockQuantity?: number
  product_categories?: {
    id: string
    name: string
    slug: string
  }
  created_at?: string
  updated_at?: string
}

export interface ProductFilters {
  category?: string
  featured?: boolean
  search?: string
  active?: boolean
}

export interface CreateProductInput {
  name: string
  slug?: string
  description?: string
  short_description?: string
  price: number
  category_id?: string
  image?: string
  images?: string[]
  benefits?: string[]
  ingredients?: string
  usage_instructions?: string
  storage_instructions?: string
  expiry_info?: string
  manufacturer?: string
  sku?: string
  is_active?: boolean
  is_featured?: boolean
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string
}

// Get all products
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<{ products: Product[] }>(
        '/products',
        filters
      )
      return response.products
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get single product by ID
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.detail(id!),
    queryFn: async () => {
      const response = await apiClient.get<{ product: Product }>(
        `/products/${id}`
      )
      return response.product
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Create product (admin only)
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const response = await apiClient.post<{ product: Product }>(
        '/products',
        data
      )
      return response.product
    },
    onSuccess: () => {
      // Invalidate products list to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.lists(),
      })
    },
  })
}

// Update product (admin only)
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateProductInput) => {
      const { id, ...updateData } = data
      const response = await apiClient.put<{ product: Product }>(
        `/products/${id}`,
        updateData
      )
      return response.product
    },
    onSuccess: (product) => {
      // Update cache for this specific product
      queryClient.setQueryData(queryKeys.products.detail(product.id), product)
      // Invalidate products list
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.lists(),
      })
    },
  })
}

// Delete product (admin only)
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`)
      return id
    },
    onSuccess: (id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.products.detail(id),
      })
      // Invalidate products list
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.lists(),
      })
    },
  })
}
