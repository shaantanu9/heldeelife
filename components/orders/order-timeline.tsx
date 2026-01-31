'use client'

import { CheckCircle2, Clock, Package, Truck, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimelineEvent {
  status: string
  label: string
  timestamp?: string
  description?: string
  location?: string
}

interface OrderTimelineProps {
  currentStatus: string
  events?: TimelineEvent[]
  trackingNumber?: string
  estimatedDelivery?: string
  className?: string
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle2 },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle },
]

export function OrderTimeline({
  currentStatus,
  events = [],
  trackingNumber,
  estimatedDelivery,
  className,
}: OrderTimelineProps) {
  const getCurrentStepIndex = () => {
    const index = statusSteps.findIndex((step) => step.key === currentStatus)
    return index >= 0 ? index : 0
  }

  const currentStepIndex = getCurrentStepIndex()

  const getEventForStep = (stepKey: string) => {
    return events.find((e) => e.status === stepKey)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-6">
        {statusSteps
          .filter(
            (step) => step.key !== 'cancelled' || currentStatus === 'cancelled'
          )
          .map((step, index) => {
            const StepIcon = step.icon
            const event = getEventForStep(step.key)
            const isCompleted = index <= currentStepIndex
            const isCurrent = index === currentStepIndex
            const isCancelled =
              currentStatus === 'cancelled' && step.key === 'cancelled'

            // Skip cancelled step unless order is actually cancelled
            if (step.key === 'cancelled' && currentStatus !== 'cancelled') {
              return null
            }

            return (
              <div key={step.key} className="relative flex items-start gap-4">
                <div
                  className={cn(
                    'relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all',
                    isCompleted || isCancelled
                      ? 'bg-orange-600 border-orange-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  )}
                >
                  <StepIcon className="h-6 w-6" />
                </div>
                <div className="flex-1 pt-2">
                  <p
                    className={cn(
                      'font-semibold',
                      isCompleted || isCancelled
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </p>
                  {event?.timestamp && (
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(event.timestamp)}
                    </p>
                  )}
                  {isCurrent && trackingNumber && (
                    <p className="text-sm text-gray-600 mt-1">
                      Tracking Number:{' '}
                      <span className="font-semibold">{trackingNumber}</span>
                    </p>
                  )}
                  {isCurrent && estimatedDelivery && (
                    <p className="text-sm text-gray-600 mt-1">
                      Estimated Delivery:{' '}
                      <span className="font-semibold">
                        {formatDate(estimatedDelivery)}
                      </span>
                    </p>
                  )}
                  {event?.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {event.description}
                    </p>
                  )}
                  {event?.location && (
                    <p className="text-xs text-gray-500 mt-1">
                      Location: {event.location}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}








