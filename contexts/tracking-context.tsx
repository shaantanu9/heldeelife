'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import { useOrder } from '@/hooks/api/use-orders'
import type { Order } from '@/hooks/api/use-orders'

export interface TrackingEvent {
  id: string
  status: string
  label: string
  timestamp?: string
  description?: string
  location?: string
}

export interface TrackingStatus {
  orderId: string
  orderNumber: string
  currentStatus: string
  events: TrackingEvent[]
  estimatedDelivery?: string
  trackingNumber?: string
  carrier?: string
}

interface TrackingContextType {
  // Current tracking
  trackingStatus: TrackingStatus | null
  isLoading: boolean
  error: Error | null

  // Actions
  trackOrder: (orderId: string) => void
  clearTracking: () => void

  // Tracking history (for multiple orders)
  trackingHistory: Map<string, TrackingStatus>
  trackMultipleOrders: (orderIds: string[]) => void
}

const statusSteps: Array<{ key: string; label: string }> = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Order Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
]

const TrackingContext = createContext<TrackingContextType | undefined>(
  undefined
)

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
  const [trackingHistory, setTrackingHistory] = useState<
    Map<string, TrackingStatus>
  >(new Map())

  // Fetch order data
  const {
    data: order,
    isLoading,
    error,
  } = useOrder(currentOrderId || undefined)

  // Build tracking status from order
  const buildTrackingStatus = useCallback(
    (orderData: Order): TrackingStatus => {
      const currentIndex = statusSteps.findIndex(
        (step) => step.key === orderData.status
      )
      const events: TrackingEvent[] = statusSteps.map((step, index) => {
        const isCompleted = index <= currentIndex
        const isCurrent = index === currentIndex

        let timestamp: string | undefined
        if (step.key === 'pending' && orderData.created_at) {
          timestamp = orderData.created_at
        } else if (step.key === 'shipped' && (orderData as any).shipped_at) {
          timestamp = (orderData as any).shipped_at
        } else if (
          step.key === 'delivered' &&
          (orderData as any).delivered_at
        ) {
          timestamp = (orderData as any).delivered_at
        }

        return {
          id: step.key,
          status: step.key,
          label: step.label,
          timestamp,
          description: isCurrent
            ? orderData.status === 'shipped' &&
              (orderData as any).tracking_number
              ? `Tracking: ${(orderData as any).tracking_number}`
              : undefined
            : undefined,
        }
      })

      return {
        orderId: orderData.id,
        orderNumber: (orderData as any).order_number || orderData.id,
        currentStatus: orderData.status,
        events: events.filter(
          (e) => e.timestamp || e.status === orderData.status
        ),
        estimatedDelivery: (orderData as any).estimated_delivery,
        trackingNumber: (orderData as any).tracking_number,
        carrier: (orderData as any).carrier,
      }
    },
    []
  )

  // Track order
  const trackOrder = useCallback((orderId: string) => {
    setCurrentOrderId(orderId)
  }, [])

  // Clear tracking
  const clearTracking = useCallback(() => {
    setCurrentOrderId(null)
  }, [])

  // Track multiple orders
  const trackMultipleOrders = useCallback(
    async (orderIds: string[]) => {
      // This would typically fetch multiple orders at once
      // For now, we'll track them individually
      const newHistory = new Map(trackingHistory)

      for (const orderId of orderIds) {
        if (!newHistory.has(orderId)) {
          // Fetch order and build tracking status
          // In a real implementation, you'd fetch all orders at once
          try {
            const response = await fetch(`/api/orders/${orderId}`)
            if (response.ok) {
              const data = await response.json()
              const status = buildTrackingStatus(data.order)
              newHistory.set(orderId, status)
            }
          } catch (error) {
            console.error(`Error tracking order ${orderId}:`, error)
          }
        }
      }

      setTrackingHistory(newHistory)
    },
    [trackingHistory, buildTrackingStatus]
  )

  // Build tracking status when order data changes
  const trackingStatus = useMemo(() => {
    if (!order) return null
    return buildTrackingStatus(order)
  }, [order, buildTrackingStatus])

  return (
    <TrackingContext.Provider
      value={{
        trackingStatus,
        isLoading,
        error: error as Error | null,

        trackOrder,
        clearTracking,

        trackingHistory,
        trackMultipleOrders,
      }}
    >
      {children}
    </TrackingContext.Provider>
  )
}

export function useTracking() {
  const context = useContext(TrackingContext)
  if (context === undefined) {
    throw new Error('useTracking must be used within a TrackingProvider')
  }
  return context
}
