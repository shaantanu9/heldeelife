'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import { useSession } from 'next-auth/react'
import {
  useOrders,
  useOrder,
  useCreateOrder,
  useUpdateOrder,
  type Order,
  type CreateOrderInput,
} from '@/hooks/api/use-orders'

interface OrderContextType {
  // Orders list
  orders: Order[] | undefined
  isLoadingOrders: boolean
  ordersError: Error | null
  refetchOrders: () => void

  // Current order
  currentOrder: Order | undefined
  isLoadingOrder: boolean
  orderError: Error | null
  setCurrentOrderId: (id: string | null) => void

  // Order actions
  createOrder: (data: CreateOrderInput) => Promise<Order | undefined>
  updateOrder: (id: string, data: Partial<Order>) => Promise<Order | undefined>
  cancelOrder: (id: string, reason?: string) => Promise<void>

  // Order filters
  orderFilters: {
    status?: string
  }
  setOrderFilters: (filters: { status?: string }) => void

  // Order stats
  orderStats: {
    total: number
    pending: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
  }
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
  const [orderFilters, setOrderFilters] = useState<{ status?: string }>({})

  // Fetch orders list
  const {
    data: orders,
    isLoading: isLoadingOrders,
    error: ordersError,
    refetch: refetchOrders,
  } = useOrders(orderFilters)

  // Fetch current order
  const {
    data: currentOrder,
    isLoading: isLoadingOrder,
    error: orderError,
  } = useOrder(currentOrderId || undefined)

  // Mutations
  const createOrderMutation = useCreateOrder()
  const updateOrderMutation = useUpdateOrder()

  // Calculate order stats with memoization
  const orderStats = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      }
    }

    // Single pass through orders for better performance
    const stats = {
      total: orders.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    }

    for (const order of orders) {
      switch (order.status) {
        case 'pending':
          stats.pending++
          break
        case 'processing':
          stats.processing++
          break
        case 'shipped':
          stats.shipped++
          break
        case 'delivered':
          stats.delivered++
          break
        case 'cancelled':
          stats.cancelled++
          break
      }
    }

    return stats
  }, [orders])

  // Create order
  const createOrder = useCallback(
    async (data: CreateOrderInput): Promise<Order | undefined> => {
      try {
        const order = await createOrderMutation.mutateAsync(data)
        return order
      } catch (error) {
        console.error('Error creating order:', error)
        throw error
      }
    },
    [createOrderMutation]
  )

  // Update order
  const updateOrder = useCallback(
    async (id: string, data: Partial<Order>): Promise<Order | undefined> => {
      try {
        const order = await updateOrderMutation.mutateAsync({ id, ...data })
        return order
      } catch (error) {
        console.error('Error updating order:', error)
        throw error
      }
    },
    [updateOrderMutation]
  )

  // Cancel order
  const cancelOrder = useCallback(
    async (id: string, reason?: string): Promise<void> => {
      try {
        await updateOrderMutation.mutateAsync({
          id,
          status: 'cancelled' as any,
          cancelled_reason: reason || 'Cancelled by customer',
        } as any)
      } catch (error) {
        console.error('Error cancelling order:', error)
        throw error
      }
    },
    [updateOrderMutation]
  )

  // Refetch orders when filters change
  useEffect(() => {
    if (session) {
      refetchOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderFilters, session])

  // Memoize refetch function
  const handleRefetchOrders = useCallback(() => {
    refetchOrders()
  }, [refetchOrders])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      orders,
      isLoadingOrders,
      ordersError: ordersError as Error | null,
      refetchOrders: handleRefetchOrders,

      currentOrder,
      isLoadingOrder,
      orderError: orderError as Error | null,
      setCurrentOrderId,

      createOrder,
      updateOrder,
      cancelOrder,

      orderFilters,
      setOrderFilters,

      orderStats,
    }),
    [
      orders,
      isLoadingOrders,
      ordersError,
      handleRefetchOrders,
      currentOrder,
      isLoadingOrder,
      orderError,
      setCurrentOrderId,
      createOrder,
      updateOrder,
      cancelOrder,
      orderFilters,
      setOrderFilters,
      orderStats,
    ]
  )

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrderContext() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrderContext must be used within an OrderProvider')
  }
  return context
}
