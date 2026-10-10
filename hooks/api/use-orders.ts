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
  /** Only present on the response to order creation */
  access_token?: string
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

// The client only states what it wants; the server prices everything from
// the database (see app/api/orders/route.ts).
export interface CreateOrderInput {
  items: Array<{
    product_id: string
    quantity: number
  }>
  shipping_address: any
  billing_address?: any
  payment_method?: 'cod' | 'online'
  coupon_code?: string
  notes?: string
}

export interface OrderFilters {
  status?: string
}

// Get all orders
export function useOrders(
  filters?: OrderFilters,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    // Signed-out visitors have no orders; don't hit the API (401) for them
    enabled: options.enabled ?? true,
    queryKey: queryKeys.orders.list(filters),
    queryFn: async () => {
      // Customer-facing list: always the caller's own orders (admins included)
      const response = await apiClient.get<{ orders: Order[] }>('/orders', {
        ...(filters as Record<
          string,
          string | number | boolean | null | undefined
        >),
        scope: 'mine',
      })
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
      const response = await apiClient.post<{
        order: Order
        access_token: string
      }>('/orders', data)
      // access_token lets guests pay for / view this order without a session
      return { ...response.order, access_token: response.access_token }
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
