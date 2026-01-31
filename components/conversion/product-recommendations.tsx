'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { UrgencyIndicator } from './urgency-indicator'
import { SocialProof } from './social-proof'
import { QuickViewModal } from './quick-view-modal'
import { Star, Heart, Eye, ShoppingCart, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Product {
  id: string
  product_id: string
  name: string
  slug: string
  price: number
  compare_at_price?: number
  image: string
  short_description?: string
  inStock: boolean
  stockQuantity?: number
  rating?: number
  reviews_count?: number
  sales_count?: number
  sku?: string
}

interface ProductRecommendationsProps {
  productId?: string
  categoryId?: string
  type?: 'related' | 'frequently-bought' | 'you-may-like' | 'trending'
  title?: string
  limit?: number
  className?: string
}

export function ProductRecommendations({
  productId,
  categoryId,
  type = 'related',
  title,
  limit = 4,
  className,
}: ProductRecommendationsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true)
      try {
        let url = '/api/products?'
        const params = new URLSearchParams()

        if (type === 'frequently-bought' && productId) {
          // In a real app, this would fetch products frequently bought together
          params.append('category', categoryId || '')
          params.append('limit', limit.toString())
          params.append('exclude', productId)
        } else if (type === 'you-may-like' && productId) {
          // Based on browsing history or similar products
          params.append('category', categoryId || '')
          params.append('limit', limit.toString())
          params.append('exclude', productId)
        } else if (type === 'trending') {
          params.append('featured', 'true')
          params.append('limit', limit.toString())
        } else {
          // Related products (same category)
          if (categoryId) {
            params.append('category', categoryId)
          }
          if (productId) {
            params.append('exclude', productId)
          }
          params.append('limit', limit.toString())
        }

        url += params.toString()
        const response = await fetch(url)
        const data = await response.json()
        setProducts((data.products || []).slice(0, limit))
      } catch (error) {
        console.error('Error fetching recommendations:', error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecommendations()
  }, [productId, categoryId, type, limit])

  const getTitle = () => {
    if (title) return title
    switch (type) {
      case 'frequently-bought':
        return 'Frequently Bought Together'
      case 'you-may-like':
        return 'You May Also Like'
      case 'trending':
        return 'Trending Products'
      default:
        return 'Related Products'
    }
  }

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      product_id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || '📦',
      sku: product.sku,
    })
    toast.success(`${product.name} added to cart`)
  }

  if (isLoading) {
    return (
      <div className={cn('py-8', className)}>
        <div className="container px-4">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">{getTitle()}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(limit)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className={cn('py-8 bg-white', className)}>
      <div className="container px-4">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-orange-600" />
          <h2 className="text-2xl font-bold text-gray-900">{getTitle()}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => {
            const discountPercentage = product.compare_at_price
              ? Math.round(
                  ((product.compare_at_price - product.price) /
                    product.compare_at_price) *
                    100
                )
              : 0
            const inWishlist = isInWishlist(product.id)

            return (
              <Card
                key={product.id}
                className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white group relative overflow-hidden"
              >
                {/* Wishlist Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() =>
                    toggleWishlist({
                      id: product.id,
                      product_id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image || '📦',
                      slug: product.slug,
                    })
                  }
                >
                  <Heart
                    className={cn(
                      'h-5 w-5',
                      inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'
                    )}
                  />
                </Button>

                {/* Discount Badge */}
                {discountPercentage > 0 && (
                  <Badge className="absolute top-2 left-2 z-10 bg-red-600 text-white">
                    {discountPercentage}% OFF
                  </Badge>
                )}

                <Link href={`/products/${product.slug || product.id}`}>
                  <CardContent className="p-4">
                    <div className="aspect-square bg-orange-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors relative overflow-hidden">
                      {product.image && product.image.startsWith('http') ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          unoptimized
                        />
                      ) : (
                        <span className="text-4xl opacity-70">
                          {product.image || '📦'}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-sm mb-2 text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>

                    {/* Rating */}
                    {product.rating && product.rating > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-3 w-3',
                                i < Math.round(product.rating || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-gray-200 text-gray-200'
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">
                          ({product.reviews_count || 0})
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-orange-600 font-bold text-lg">
                        Rs. {Number(product.price).toFixed(2)}
                      </p>
                      {product.compare_at_price && (
                        <p className="text-gray-400 line-through text-xs">
                          Rs. {Number(product.compare_at_price).toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* Urgency & Social Proof */}
                    <div className="space-y-1 mb-2">
                      <UrgencyIndicator
                        stockQuantity={product.stockQuantity || 0}
                        lowStockThreshold={10}
                        isOnSale={discountPercentage > 0}
                      />
                      <SocialProof
                        reviewsCount={product.reviews_count}
                        averageRating={product.rating}
                        salesCount={product.sales_count}
                        variant="compact"
                        className="text-xs"
                      />
                    </div>
                  </CardContent>
                </Link>

                <CardFooter className="pt-0 px-4 pb-4 flex gap-2">
                  <Button
                    className="flex-1 text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={(e) => {
                      e.preventDefault()
                      handleAddToCart(product)
                    }}
                    disabled={!product.inStock}
                    size="sm"
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {product.inStock ? 'Add' : 'Out'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      setQuickViewProduct(product)
                    }}
                    className="flex-shrink-0"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  )
}
