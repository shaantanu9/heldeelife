'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Check,
  AlertCircle,
  Clock,
  Shield,
  Truck,
  TrendingUp,
  Users,
  Minus,
  Plus,
  Loader2,
  Verified,
} from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { UrgencyIndicator } from '@/components/conversion/urgency-indicator'
import { SocialProof } from '@/components/conversion/social-proof'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Product {
  id: string
  product_id: string
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
  short_description?: string
  sku?: string
}

interface MobileProductDetailProps {
  product: Product
}

export function MobileProductDetail({ product }: MobileProductDetailProps) {
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [selectedImage, setSelectedImage] = useState(product.image)

  const discountPercentage = product.compare_at_price
    ? Math.round(
        ((product.compare_at_price - product.price) /
          product.compare_at_price) *
          100
      )
    : 0

  const handleAddToCart = async () => {
    if (!product.inStock) return

    setIsAddingToCart(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))

      for (let i = 0; i < quantity; i++) {
        addToCart({
          id: product.id,
          product_id: product.product_id,
          name: product.name,
          price: Number(product.price),
          image: product.image || '📦',
          sku: product.sku,
        })
      }

      toast.success(
        `${quantity} item${quantity > 1 ? 's' : ''} added to cart!`,
        {
          description: product.name,
          action: {
            label: 'View Cart',
            onClick: () => router.push('/cart'),
          },
        }
      )
    } catch (error) {
      toast.error('Failed to add to cart')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const allImages = [product.image, ...(product.images || [])].filter(Boolean)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && currentImageIndex < allImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
      setSelectedImage(allImages[currentImageIndex + 1])
    }
    if (isRightSwipe && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
      setSelectedImage(allImages[currentImageIndex - 1])
    }
  }

  useEffect(() => {
    const index = allImages.findIndex((img) => img === selectedImage)
    if (index !== -1) {
      setCurrentImageIndex(index)
    }
  }, [selectedImage, allImages])

  return (
    <>
      {/* Mobile-Optimized Product Detail - Above the Fold */}
      <div className="md:hidden">
        {/* Product Image - Full Width, Swipeable */}
        <div
          className="relative w-full aspect-square bg-orange-50 mb-0 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {selectedImage && selectedImage.startsWith('http') ? (
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              className="object-contain"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-9xl opacity-50">
                {product.image || '📦'}
              </span>
            </div>
          )}

          {/* Image Gallery Dots */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImage(img)
                    setCurrentImageIndex(idx)
                  }}
                  className={`h-2 rounded-full transition-all ${
                    img === selectedImage
                      ? 'bg-white w-6'
                      : 'bg-white/60 w-2 hover:bg-white/80'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Swipe Indicator */}
          {allImages.length > 1 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/30 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full pointer-events-none">
              {currentImageIndex + 1} / {allImages.length}
            </div>
          )}

          {/* Wishlist Button - Top Right */}
          <button
            onClick={() =>
              toggleWishlist({
                id: product.id,
                product_id: product.product_id,
                name: product.name,
                price: product.price,
                image: product.image,
              })
            }
            className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg active:scale-95 transition-transform"
            aria-label={
              isInWishlist(product.product_id)
                ? 'Remove from wishlist'
                : 'Add to wishlist'
            }
          >
            <Heart
              className={`h-5 w-5 ${
                isInWishlist(product.product_id)
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-600'
              }`}
            />
          </button>
        </div>

        {/* Product Info - Compact, Above the Fold */}
        <div className="px-4 pt-4 pb-20 bg-white">
          {/* Product Name */}
          <h1 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h1>

          {/* Rating & Reviews - Compact */}
          {product.rating && product.rating > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(product.rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {product.rating.toFixed(1)}
              </span>
              {product.reviews_count && (
                <Link
                  href="#reviews"
                  className="text-xs text-gray-600 underline"
                >
                  ({product.reviews_count} reviews)
                </Link>
              )}
            </div>
          )}

          {/* Price - Large, Prominent */}
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-orange-600">
                Rs. {Number(product.price).toFixed(2)}
              </span>
              {product.compare_at_price && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    Rs. {Number(product.compare_at_price).toFixed(2)}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    {discountPercentage}% OFF
                  </Badge>
                </>
              )}
            </div>
            {product.compare_at_price && (
              <p className="text-sm text-green-600 font-semibold mt-1">
                You save Rs.{' '}
                {(
                  Number(product.compare_at_price) - Number(product.price)
                ).toFixed(2)}
              </p>
            )}
          </div>

          {/* Urgency Indicators - Compact */}
          <UrgencyIndicator
            stockQuantity={product.stockQuantity}
            isOnSale={discountPercentage > 0}
            discountPercentage={discountPercentage}
            className="mb-3"
          />

          {/* Social Proof - Compact */}
          <SocialProof
            reviewsCount={product.reviews_count}
            averageRating={product.rating}
            salesCount={product.sales_count}
            variant="compact"
            className="mb-4 text-xs"
          />

          {/* Stock Status */}
          {product.inStock ? (
            <div className="flex items-center gap-2 text-green-600 mb-4">
              <Check className="h-4 w-4" />
              <span className="text-sm font-semibold">In Stock</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-semibold">Out of Stock</span>
            </div>
          )}

          {/* Short Description - Collapsible */}
          {product.short_description && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {product.short_description}
              </p>
            </div>
          )}

          {/* Trust Badges - Compact Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Truck className="h-3 w-3 text-orange-600" />
              <span>Free Delivery</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <Shield className="h-3 w-3 text-orange-600" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <Verified className="h-3 w-3 text-orange-600" />
              <span>Authentic</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <Clock className="h-3 w-3 text-orange-600" />
              <span>Easy Returns</span>
            </div>
          </div>

          {/* Quantity Selector - Compact */}
          <div className="flex items-center justify-between py-3 border-y border-gray-200 mb-4">
            <span className="font-semibold text-gray-900 text-sm">
              Quantity:
            </span>
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-semibold text-sm">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(quantity + 1)}
                disabled={!product.inStock || quantity >= product.stockQuantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky Add to Cart Bar - Always Visible */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden safe-area-inset-bottom">
          <div className="px-4 py-3 flex items-center gap-3">
            {/* Price Display */}
            <div className="flex-1">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-orange-600">
                  Rs. {Number(product.price).toFixed(2)}
                </span>
                {product.compare_at_price && (
                  <span className="text-sm text-gray-400 line-through">
                    Rs. {Number(product.compare_at_price).toFixed(2)}
                  </span>
                )}
              </div>
              {product.inStock && (
                <p className="text-xs text-green-600 font-semibold">In Stock</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() =>
                  toggleWishlist({
                    id: product.id,
                    product_id: product.product_id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                  })
                }
              >
                <Heart
                  className={`h-5 w-5 ${
                    isInWishlist(product.product_id)
                      ? 'fill-red-500 text-red-500'
                      : ''
                  }`}
                />
              </Button>
              <Button
                onClick={handleAddToCart}
                disabled={isAddingToCart || !product.inStock}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold h-10 min-w-[120px]"
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
