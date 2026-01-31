'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Heart, Star, Eye } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { UrgencyIndicator } from './urgency-indicator'
import { SocialProof } from './social-proof'
import { toast } from 'sonner'

interface Product {
  id: string
  product_id: string
  name: string
  price: number
  compare_at_price?: number
  image: string
  slug?: string
  short_description?: string
  inStock?: boolean
  stockQuantity?: number
  rating?: number
  reviews_count?: number
  sales_count?: number
}

interface QuickViewModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export function QuickViewModal({
  product,
  isOpen,
  onClose,
}: QuickViewModalProps) {
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const discountPercentage = product.compare_at_price
    ? Math.round(
        ((product.compare_at_price - product.price) /
          product.compare_at_price) *
          100
      )
    : 0

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        product_id: product.product_id,
        name: product.name,
        price: product.price,
        image: product.image,
      })
    }
    toast.success('Added to cart!', {
      description: `${quantity} x ${product.name}`,
    })
    onClose()
  }

  const handleWishlistToggle = () => {
    toggleWishlist({
      id: product.id,
      product_id: product.product_id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            Quick View: {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="relative aspect-square bg-orange-50 rounded-lg overflow-hidden">
            {product.image && product.image.startsWith('http') ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl opacity-70">
                  {product.image || '📦'}
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl font-bold text-orange-600">
                  Rs. {Number(product.price).toFixed(2)}
                </span>
                {product.compare_at_price &&
                  product.compare_at_price > product.price && (
                    <>
                      <span className="text-xl text-gray-400 line-through">
                        Rs. {Number(product.compare_at_price).toFixed(2)}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-red-100 text-red-700"
                      >
                        {discountPercentage}% OFF
                      </Badge>
                    </>
                  )}
              </div>

              {/* Rating & Reviews */}
              <SocialProof
                reviewsCount={product.reviews_count}
                averageRating={product.rating}
                salesCount={product.sales_count}
                variant="compact"
                className="mb-3"
              />

              {/* Urgency Indicators */}
              <UrgencyIndicator
                stockQuantity={product.stockQuantity}
                isOnSale={discountPercentage > 0}
                discountPercentage={discountPercentage}
                className="mb-4"
              />

              {/* Description */}
              {product.short_description && (
                <p className="text-gray-600 mb-4">
                  {product.short_description}
                </p>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                Quantity:
              </label>
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-8 w-8"
                >
                  -
                </Button>
                <span className="w-12 text-center font-semibold">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-8 w-8"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button
                variant="outline"
                onClick={handleWishlistToggle}
                className={
                  isInWishlist(product.product_id)
                    ? 'border-red-300 text-red-600'
                    : ''
                }
              >
                <Heart
                  className={`h-4 w-4 ${
                    isInWishlist(product.product_id)
                      ? 'fill-red-500 text-red-500'
                      : ''
                  }`}
                />
              </Button>
            </div>

            {/* View Full Details */}
            <Link href={`/products/${product.slug || product.id}`}>
              <Button variant="ghost" className="w-full" onClick={onClose}>
                <Eye className="h-4 w-4 mr-2" />
                View Full Details
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}









