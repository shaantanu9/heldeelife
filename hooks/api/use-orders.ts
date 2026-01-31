/**
 * Orders API Hooks
 * Centralized hooks for order-related API calls with caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/query-keys'

// Types
export interface OrderItem {
  id: string
  product_id?: string
  product_name: string
  product_sku?: string
  product_image?: string
  quantity: number
  unit_price: number
  total_price: number
  discount_amount?: number
}

export interface OrderStatusHistory {
  id: string
  status: string
  previous_status?: string
  notes?: string
  location?: string
  created_at: string
}

export interface Order {
  id: string
  order_number?: string
  user_id: string
  shipping_address: any
  billing_address?: any
  payment_method: string
  payment_transaction_id?: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  status: string
  payment_status: string
  currency?: string
  tracking_number?: string
  carrier?: string
  estimated_delivery?: string
  customer_email?: string
  customer_phone?: string
  customer_name?: string
  notes?: string
  shipped_at?: string
  delivered_at?: string
  cancelled_at?: string
  cancelled_reason?: string
  order_items?: OrderItem[]
  order_status_history?: OrderStatusHistory[]
  created_at: string
  updated_at: string
}

export interface CreateOrderInput {
  items: Array<{
    product_id: string
    name: string
    sku?: string
    price: number
    quantity: number
  }>
  shipping_address: any
  billing_address?: any
  payment_method?: string
  subtotal: number
  tax_amount?: number
  shipping_amount?: number
  discount_amount?: number
  coupon_id?: string
  notes?: string
}

export interface OrderFilters {
  status?: string
}

// Get all orders
export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<{ orders: Order[] }>(
        '/orders',
        filters
      )
      // Ensure we always return an array, never undefined
      return response?.orders || []
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (orders change frequently)
  })
}

// Get single order by ID
export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id!),
    queryFn: async () => {
      const response = await apiClient.get<{ order: Order }>(`/orders/${id}`)
      return response.order
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Create order
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateOrderInput) => {
      const response = await apiClient.post<{ order: Order }>('/orders', data)
      return response.order
    },
    onSuccess: (order) => {
      // Add to cache
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order)
      // Invalidate orders list
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.lists(),
      })
    },
  })
}

// Update order status (admin only)
export function useUpdateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Order>) => {
      const response = await apiClient.put<{ order: Order }>(
        `/orders/${id}`,
        data
      )
      return response.order
    },
    onSuccess: (order) => {
      // Update cache
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order)
      // Invalidate orders list
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.lists(),
      })
    },
  })
}
