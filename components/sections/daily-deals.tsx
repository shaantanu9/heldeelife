'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, Flame, ArrowRight } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { UrgencyIndicator } from '@/components/conversion/urgency-indicator'
import { SocialProof } from '@/components/conversion/social-proof'

interface DealProduct {
  id: string
  product_id: string
  name: string
  price: number
  compare_at_price?: number
  image: string
  slug?: string
  stockQuantity?: number
  inStock?: boolean
  rating?: number
  reviews_count?: number
  sales_count?: number
  dealEndsAt?: Date
}

export function DailyDeals() {
  const [deals, setDeals] = useState<DealProduct[]>([])
  const [timeRemaining, setTimeRemaining] = useState('')
  const { addToCart } = useCart()

  const updateCountdown = useCallback(() => {
    if (deals.length === 0) return

    const now = new Date()
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
    const diff = endTime.getTime() - now.getTime()

    if (diff <= 0) {
      setTimeRemaining('Deal Ended')
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
  }, [deals.length])

  useEffect(() => {
    // Fetch deals from API
    const fetchDeals = async () => {
      try {
        const response = await fetch('/api/products?featured=true&limit=6')
        const data = await response.json()

        // Add deal end time (24 hours from now)
        const dealsWithTime = (data.products || []).map((product: any) => ({
          ...product,
          dealEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        }))

        setDeals(dealsWithTime)
      } catch (error) {
        console.error('Error fetching deals:', error)
      }
    }

    fetchDeals()

    // Update countdown every minute
    const interval = setInterval(() => {
      updateCountdown()
    }, 60000)

    updateCountdown()

    return () => clearInterval(interval)
  }, [updateCountdown])

  if (deals.length === 0) return null

  return (
    <section className="py-12 bg-gradient-to-br from-orange-50 via-white to-orange-50/40">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-lg">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Daily Deals</h2>
              <p className="text-sm text-gray-600">
                Limited time offers - Don&apos;t miss out!
              </p>
            </div>
          </div>
          {timeRemaining && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-lg border border-orange-200">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="font-semibold text-orange-700">
                {timeRemaining}
              </span>
            </div>
          )}
        </div>

        {/* Mobile Countdown */}
        {timeRemaining && (
          <div className="md:hidden flex items-center justify-center gap-2 mb-6 px-4 py-3 bg-orange-100 rounded-lg border border-orange-200">
            <Clock className="h-5 w-5 text-orange-600" />
            <span className="font-semibold text-orange-700">
              Ends in: {timeRemaining}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {deals.map((product) => {
            const discountPercentage = product.compare_at_price
              ? Math.round(
                  ((product.compare_at_price - product.price) /
                    product.compare_at_price) *
                    100
                )
              : 0

            return (
              <Card
                key={product.id}
                className="group relative border-2 border-orange-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white overflow-hidden"
              >
                {/* Deal Badge */}
                <div className="absolute top-2 left-2 z-10">
                  <Badge className="bg-red-600 text-white border-0 shadow-lg animate-pulse">
                    <Flame className="h-3 w-3 mr-1" />
                    DEAL
                  </Badge>
                </div>

                <Link href={`/products/${product.slug || product.id}`}>
                  <CardContent className="p-4">
                    <div className="aspect-square bg-orange-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors relative overflow-hidden">
                      {product.image && product.image.startsWith('http') ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                        />
                      ) : (
                        <span className="text-5xl opacity-70">
                          {product.image || '📦'}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm mb-2 text-gray-900 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-orange-600">
                        Rs. {Number(product.price).toFixed(2)}
                      </span>
                      {product.compare_at_price && (
                        <span className="text-sm text-gray-400 line-through">
                          Rs. {Number(product.compare_at_price).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {discountPercentage > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-red-100 text-red-700 text-xs mb-2"
                      >
                        {discountPercentage}% OFF
                      </Badge>
                    )}
                    <SocialProof
                      reviewsCount={product.reviews_count}
                      averageRating={product.rating}
                      variant="compact"
                      className="text-xs"
                    />
                  </CardContent>
                </Link>
                <CardFooter className="pt-0 px-4 pb-4">
                  <Button
                    onClick={() =>
                      addToCart({
                        id: product.id,
                        product_id: product.product_id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                      })
                    }
                    disabled={!product.inStock}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm"
                  >
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-8">
          <Link href="/shop?onSale=true">
            <Button
              variant="outline"
              className="border-orange-600 text-orange-600 hover:bg-orange-50"
            >
              View All Deals
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
