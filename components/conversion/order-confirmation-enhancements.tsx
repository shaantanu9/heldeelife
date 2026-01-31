'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Users,
  TrendingUp,
  Gift,
  Star,
  Share2,
  Download,
  Truck,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Order Success Celebration - Positive reinforcement
export function OrderSuccessCelebration({
  orderNumber,
  className,
}: {
  orderNumber: string
  className?: string
}) {
  return (
    <Card className={cn('border border-green-200 bg-gradient-to-br from-green-50 to-white', className)}>
      <CardContent className="p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          🎉 Order Confirmed!
        </h2>
        <p className="text-lg text-gray-600 mb-4">
          Thank you for your purchase! Your order #{orderNumber} has been
          confirmed.
        </p>
        <Badge className="bg-green-600 text-white px-4 py-2 text-sm">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Payment Received
        </Badge>
      </CardContent>
    </Card>
  )
}

// Order Social Proof - Builds trust
export function OrderSocialProof({ className }: { className?: string }) {
  return (
    <Card className={cn('border border-blue-200 bg-blue-50', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              Join 50,000+ happy customers
            </p>
            <p className="text-xs text-gray-600">
              You&apos;re now part of our trusted community
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Order Next Steps - Reduces anxiety
export function OrderNextSteps({ className }: { className?: string }) {
  const steps = [
    {
      icon: CheckCircle2,
      title: 'Order Confirmed',
      description: 'We&apos;ve received your order',
      completed: true,
    },
    {
      icon: Truck,
      title: 'Processing',
      description: 'We&apos;re preparing your order',
      completed: false,
    },
    {
      icon: Truck,
      title: 'Shipped',
      description: 'Your order is on the way',
      completed: false,
    },
    {
      icon: CheckCircle2,
      title: 'Delivered',
      description: 'Enjoy your products!',
      completed: false,
    },
  ]

  return (
    <Card className={cn('border border-gray-200 bg-white', className)}>
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          What Happens Next?
        </h3>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                  step.completed
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                <step.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p
                  className={cn(
                    'font-semibold',
                    step.completed ? 'text-gray-900' : 'text-gray-600'
                  )}
                >
                  {step.title}
                </p>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Order Trust Signals - Reduces post-purchase anxiety
export function OrderTrustSignals({ className }: { className?: string }) {
  const signals = [
    {
      icon: Shield,
      text: '100% Purchase Protection',
      color: 'text-blue-600',
    },
    {
      icon: Truck,
      text: 'Free Shipping Included',
      color: 'text-green-600',
    },
    {
      icon: CheckCircle2,
      text: '30-Day Return Policy',
      color: 'text-orange-600',
    },
  ]

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
      {signals.map((signal, index) => (
        <Card
          key={index}
          className="border border-gray-200 bg-white hover:shadow-md transition-shadow"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <signal.icon className={cn('h-5 w-5 flex-shrink-0', signal.color)} />
              <span className="text-sm font-semibold text-gray-900">
                {signal.text}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Order Upsell - Increases AOV
export function OrderUpsell({
  recommendedProducts,
  className,
}: {
  recommendedProducts?: Array<{
    id: string
    name: string
    price: number
    image: string
    slug: string
  }>
  className?: string
}) {
  if (!recommendedProducts || recommendedProducts.length === 0) return null

  return (
    <Card className={cn('border border-orange-200 bg-orange-50', className)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-900">
            Complete Your Wellness Journey
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Customers who bought this also purchased:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedProducts.slice(0, 3).map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="block"
            >
              <Card className="border border-gray-200 hover:shadow-md transition-shadow bg-white">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-3xl">{product.image}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                    {product.name}
                  </p>
                  <p className="text-sm font-bold text-orange-600">
                    Rs. {product.price.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Order Review Prompt - Social proof generation
export function OrderReviewPrompt({
  orderId,
  productId,
  productName,
  className,
}: {
  orderId: string
  productId: string
  productName: string
  className?: string
}) {
  return (
    <Card className={cn('border border-purple-200 bg-purple-50', className)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Star className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Love Your Purchase?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Share your experience and help others discover authentic Ayurvedic
              products
            </p>
            <Button
              asChild
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Link href={`/products/${productId}?review=true`}>
                <Star className="h-4 w-4 mr-2" />
                Write a Review
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Order Share - Viral growth
export function OrderShare({
  orderNumber,
  className,
}: {
  orderNumber: string
  className?: string
}) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'I just ordered from heldeelife!',
          text: `Check out heldeelife for authentic Ayurvedic products! Order #${orderNumber}`,
          url: window.location.origin,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    }
  }

  return (
    <Card className={cn('border border-gray-200 bg-white', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Share Your Purchase
            </p>
            <p className="text-xs text-gray-600">
              Help friends discover authentic Ayurvedic products
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Order Download - Utility
export function OrderDownloadButton({
  orderId,
  className,
}: {
  orderId: string
  className?: string
}) {
  const handleDownload = () => {
    // In a real app, this would generate and download a PDF invoice
    window.print()
  }

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      className={cn('w-full', className)}
    >
      <Download className="h-4 w-4 mr-2" />
      Download Invoice
    </Button>
  )
}









