'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Minus,
  Plus,
  Check,
  Star,
  Shield,
  Truck,
  Clock,
  Users,
  TrendingUp,
  Heart,
  Share2,
  Play,
  ThumbsUp,
  Verified,
  Loader2,
  ShoppingCart,
} from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { ComparisonButton } from '@/components/conversion/product-comparison'
import { PriceDropAlert } from '@/components/conversion/price-drop-alert'
import { BackInStockAlert } from '@/components/conversion/back-in-stock-alert'
import { AnalyticsTracker } from '@/lib/analytics/tracking'
import { getPriceDisplay } from '@/lib/utils/pricing'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  price: number
  compare_at_price?: number
  image: string
  images?: string[]
  inStock: boolean
  stockQuantity: number
  rating?: number
  reviews_count?: number
  sales_count?: number
  views_count?: number
}

interface Review {
  id: string
  rating: number
  title?: string
  comment?: string
  is_verified_purchase: boolean
  created_at: string
  users?: {
    full_name?: string
    email?: string
  }
}

interface ProductEnhancedProps {
  product: Product
}

export function ProductEnhanced({ product }: ProductEnhancedProps) {
  const { addToCart, totalItems } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [imageError, setImageError] = useState(false)

  const isWishlisted = isInWishlist(product.id)

  // Track product view on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      AnalyticsTracker.trackProductView(
        product.id,
        product.name,
        product.price
      )
      AnalyticsTracker.trackConversionFunnel('view', {
        product_id: product.id,
        product_name: product.name,
      })
    }
  }, [product.id, product.name, product.price])

  // Fetch reviews
  useEffect(() => {
    fetch(`/api/reviews?product_id=${product.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews) {
          setReviews(data.reviews)
          const avg =
            data.reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) /
            data.reviews.length
          setAverageRating(avg || product.rating || 0)
        }
      })
      .catch(console.error)
  }, [product.id, product.rating])

  const handleAddToCart = async () => {
    if (!product || !product.inStock) return

    setIsAddingToCart(true)

    try {
      // Simulate a small delay for better UX (can be removed if cart is instant)
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Add items to cart
      for (let i = 0; i < quantity; i++) {
        addToCart({
          id: product.id,
          product_id: product.id,
          name: product.name,
          price: Number(product.price),
          image: product.image || '📦',
          sku: product.sku,
        })
      }

      // Track conversion funnel
      if (typeof window !== 'undefined') {
        AnalyticsTracker.trackConversionFunnel('cart', {
          product_id: product.id,
          quantity,
        })
      }

      // Show success message
      toast.success(
        `${quantity} ${quantity === 1 ? 'item' : 'items'} added to cart!`,
        {
          description: product.name,
          action: {
            label: 'View Cart',
            onClick: () => router.push('/cart'),
          },
        }
      )

      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 2000)
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add item to cart. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const discountPercentage = product.compare_at_price
    ? Math.round(
        ((product.compare_at_price - product.price) /
          product.compare_at_price) *
          100
      )
    : 0

  const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 10
  const isVeryLowStock = product.stockQuantity > 0 && product.stockQuantity < 5

  return (
    <div className="space-y-6">
      {/* Trust Badges & Social Proof */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2 text-green-600">
          <Shield className="h-4 w-4" />
          <span className="font-semibold">Secure Payment</span>
        </div>
        <div className="flex items-center gap-2 text-blue-600">
          <Truck className="h-4 w-4" />
          <span className="font-semibold">Free Shipping</span>
        </div>
        {product.reviews_count && product.reviews_count > 0 && (
          <div className="flex items-center gap-2 text-orange-600">
            <Users className="h-4 w-4" />
            <span className="font-semibold">
              {product.reviews_count}+ Happy Customers
            </span>
          </div>
        )}
        {product.sales_count && product.sales_count > 0 && (
          <div className="flex items-center gap-2 text-purple-600">
            <TrendingUp className="h-4 w-4" />
            <span className="font-semibold">{product.sales_count}+ Sold</span>
          </div>
        )}
      </div>

      {/* Price with Scarcity - Using Charm Pricing */}
      <div className="space-y-2">
        {(() => {
          const priceDisplay = getPriceDisplay(
            Number(product.price),
            product.compare_at_price
              ? Number(product.compare_at_price)
              : undefined
          )
          return (
            <>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-orange-600">
                  {priceDisplay.current}
                </span>
                {priceDisplay.original && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      {priceDisplay.original}
                    </span>
                    <Badge variant="destructive" className="ml-2">
                      {priceDisplay.discount}% OFF
                    </Badge>
                  </>
                )}
              </div>
              {priceDisplay.savings && (
                <p className="text-sm text-green-600 font-semibold">
                  {priceDisplay.savings}
                </p>
              )}
            </>
          )
        })()}
      </div>

      {/* Rating & Reviews */}
      {averageRating > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.round(averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="font-semibold text-gray-900">
            {averageRating.toFixed(1)}
          </span>
          {product.reviews_count && product.reviews_count > 0 && (
            <Link
              href="#reviews"
              className="text-sm text-gray-600 hover:text-orange-600 underline"
            >
              ({product.reviews_count}{' '}
              {product.reviews_count === 1 ? 'review' : 'reviews'})
            </Link>
          )}
        </div>
      )}

      {/* Price Drop Alert */}
      <PriceDropAlert
        productId={product.id}
        productName={product.name}
        currentPrice={Number(product.price)}
        previousPrice={
          product.compare_at_price
            ? Number(product.compare_at_price)
            : undefined
        }
        variant="inline"
      />

      {/* Stock Status with Urgency */}
      {product.inStock ? (
        <div className="space-y-2">
          {isVeryLowStock ? (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700">
                ⚠️ Only {product.stockQuantity} left in stock! Order now to
                avoid disappointment.
              </span>
            </div>
          ) : isLowStock ? (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700">
                Only {product.stockQuantity} left in stock
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-4 w-4" />
              <span className="font-semibold">In Stock - Ready to Ship</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-red-600 p-3 bg-red-50 border border-red-200 rounded-lg">
            <span className="font-semibold">Out of Stock</span>
          </div>
          <BackInStockAlert
            productId={product.id}
            productName={product.name}
            isInStock={product.inStock}
            variant="inline"
          />
        </div>
      )}

      {/* Quantity Selector */}
      <div className="flex items-center gap-4 py-4 border-y border-gray-200">
        <span className="font-semibold text-gray-900">Quantity:</span>
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg hover:bg-orange-50 hover:text-orange-600"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-semibold">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg hover:bg-orange-50 hover:text-orange-600"
            onClick={() => setQuantity(quantity + 1)}
            disabled={!product.inStock || quantity >= product.stockQuantity}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg py-6"
          onClick={handleAddToCart}
          disabled={isAddingToCart || addedToCart || !product.inStock}
        >
          {isAddingToCart ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Adding to Cart...
            </>
          ) : addedToCart ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Added to Cart
            </>
          ) : !product.inStock ? (
            'Out of Stock'
          ) : (
            <>
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart - Buy Now
            </>
          )}
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="w-full rounded-lg border-2 hover:bg-gray-50"
            onClick={() =>
              toggleWishlist({
                id: product.id,
                product_id: product.id,
                name: product.name,
                price: product.price,
                image: product.image || '📦',
              })
            }
          >
            <Heart
              className={`h-4 w-4 mr-2 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`}
            />
            {isWishlisted ? 'Wishlisted' : 'Wishlist'}
          </Button>
          <ComparisonButton
            product={{
              id: product.id,
              product_id: product.id,
              name: product.name,
              slug: '',
              price: product.price,
              compare_at_price: product.compare_at_price,
              image: product.image,
              short_description: '',
              description: '',
              inStock: product.inStock,
              stockQuantity: product.stockQuantity,
              rating: product.rating,
              reviews_count: product.reviews_count,
              sales_count: product.sales_count,
              sku: '',
            }}
            variant="default"
          />
          <Button
            variant="outline"
            className="w-full rounded-lg border-2 hover:bg-gray-50"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: product.name,
                  text: `Check out ${product.name} on HeldeeLife!`,
                  url: window.location.href,
                })
              }
            }}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Quick Benefits */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-600" />
              <span className="text-gray-700">Free Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-600" />
              <span className="text-gray-700">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-gray-700">Easy Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <Verified className="h-4 w-4 text-orange-600" />
              <span className="text-gray-700">Authentic Products</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
