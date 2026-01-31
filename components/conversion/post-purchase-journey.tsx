'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Star,
  Share2,
  Download,
  ShoppingBag,
  ArrowRight,
  Mail,
  Bell,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { AnalyticsTracker } from '@/lib/analytics/tracking'

interface PostPurchaseJourneyProps {
  orderId: string
  orderNumber: string
  orderStatus: string
  estimatedDelivery?: string
  className?: string
}

/**
 * Complete Post-Purchase Journey Component
 * Guides users through the entire post-purchase experience
 */
export function PostPurchaseJourney({
  orderId,
  orderNumber,
  orderStatus,
  estimatedDelivery,
  className,
}: PostPurchaseJourneyProps) {
  const [currentStep, setCurrentStep] = useState(0)

  // Determine current step based on order status
  useEffect(() => {
    const statusSteps: Record<string, number> = {
      pending: 0,
      confirmed: 1,
      processing: 1,
      shipped: 2,
      delivered: 3,
      cancelled: -1,
    }
    setCurrentStep(statusSteps[orderStatus] || 0)
  }, [orderStatus])

  const steps = [
    {
      icon: CheckCircle2,
      title: 'Order Confirmed',
      description: 'Your order has been received',
      status: currentStep >= 0 ? 'completed' : 'pending',
    },
    {
      icon: Package,
      title: 'Processing',
      description: 'We&apos;re preparing your order',
      status: currentStep >= 1 ? 'completed' : currentStep === 0 ? 'active' : 'pending',
    },
    {
      icon: Truck,
      title: 'Shipped',
      description: 'Your order is on the way',
      status: currentStep >= 2 ? 'completed' : currentStep === 1 ? 'active' : 'pending',
    },
    {
      icon: CheckCircle2,
      title: 'Delivered',
      description: 'Enjoy your products!',
      status: currentStep >= 3 ? 'completed' : currentStep === 2 ? 'active' : 'pending',
    },
  ]

  const handleAction = (action: string) => {
    AnalyticsTracker.trackEvent({
      event: 'post_purchase_action',
      category: 'Ecommerce',
      action: 'Post Purchase Action',
      label: action,
      metadata: {
        order_id: orderId,
        order_number: orderNumber,
        action,
      },
    })
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Order Progress Timeline */}
      <Card className="border border-gray-200 shadow-md bg-white">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            Order Progress
          </h3>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200">
              <div
                className="absolute top-0 left-0 w-full bg-orange-600 transition-all duration-500"
                style={{
                  height: `${(currentStep / (steps.length - 1)) * 100}%`,
                }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-8 relative">
              {steps.map((step, index) => {
                const StepIcon = step.icon
                const isCompleted = step.status === 'completed'
                const isActive = step.status === 'active'
                const isPending = step.status === 'pending'

                return (
                  <div key={index} className="flex items-start gap-4">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 transition-all',
                        isCompleted
                          ? 'bg-green-100 text-green-600'
                          : isActive
                            ? 'bg-orange-100 text-orange-600 ring-4 ring-orange-200'
                            : 'bg-gray-100 text-gray-400'
                      )}
                    >
                      <StepIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={cn(
                            'font-semibold',
                            isCompleted || isActive
                              ? 'text-gray-900'
                              : 'text-gray-500'
                          )}
                        >
                          {step.title}
                        </h4>
                        {isActive && (
                          <Badge className="bg-orange-600 text-white text-xs">
                            Current
                          </Badge>
                        )}
                        {isCompleted && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p
                        className={cn(
                          'text-sm',
                          isCompleted || isActive
                            ? 'text-gray-600'
                            : 'text-gray-400'
                        )}
                      >
                        {step.description}
                      </p>
                      {isActive && estimatedDelivery && (
                        <p className="text-xs text-orange-600 mt-1">
                          Estimated delivery: {new Date(estimatedDelivery).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Actions Based on Status */}
      {orderStatus === 'pending' && (
        <Card className="border border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Clock className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">
                  What&apos;s Next?
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Your order is being processed. You&apos;ll receive a confirmation
                  email shortly. We&apos;ll notify you when your order ships.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('download_invoice')}
                    asChild
                  >
                    <Link href={`/orders/${orderId}`}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('track_order')}
                    asChild
                  >
                    <Link href={`/tracking?orderId=${orderId}`}>
                      <Truck className="h-4 w-4 mr-2" />
                      Track Order
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {orderStatus === 'shipped' && (
        <Card className="border border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Truck className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">
                  🎉 Your Order is on the Way!
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Your order has been shipped and is on its way to you. Track
                  your shipment in real-time.
                </p>
                <Button
                  onClick={() => handleAction('track_shipment')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  asChild
                >
                  <Link href={`/tracking?orderId=${orderId}`}>
                    <Truck className="h-4 w-4 mr-2" />
                    Track Shipment
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {orderStatus === 'delivered' && (
        <Card className="border border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Order Delivered! 🎉
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  We hope you love your purchase! Share your experience and help
                  others discover authentic Ayurvedic products.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('write_review')}
                    asChild
                  >
                    <Link href={`/orders/${orderId}?review=true`}>
                      <Star className="h-4 w-4 mr-2" />
                      Write Review
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('share_order')}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('shop_again')}
                    asChild
                  >
                    <Link href="/shop">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Shop Again
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={() => handleAction('view_order')}
          asChild
        >
          <Link href={`/orders/${orderId}`}>
            <Package className="h-5 w-5" />
            <span className="text-xs">View Order</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={() => handleAction('track_order')}
          asChild
        >
          <Link href={`/tracking?orderId=${orderId}`}>
            <Truck className="h-5 w-5" />
            <span className="text-xs">Track</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={() => handleAction('download_invoice')}
        >
          <Download className="h-5 w-5" />
          <span className="text-xs">Invoice</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={() => handleAction('shop_again')}
          asChild
        >
          <Link href="/shop">
            <ShoppingBag className="h-5 w-5" />
            <span className="text-xs">Shop More</span>
          </Link>
        </Button>
      </div>

      {/* Email Notifications */}
      <Card className="border border-gray-200 bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Get Order Updates
                </p>
                <p className="text-xs text-gray-600">
                  Receive email notifications about your order status
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('enable_notifications')}
            >
              <Bell className="h-4 w-4 mr-2" />
              Enable
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}









