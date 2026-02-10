'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Sparkles, CheckCircle2, Star, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getPriceDisplay, calculateSavings } from '@/lib/utils/pricing'

interface BundleProduct {
  id: string
  product_id: string
  name: string
  slug: string
  price: number
  compare_at_price?: number
  image: string
  short_description?: string
  inStock: boolean
  rating?: number
  reviews_count?: number
  sku?: string
}

interface ProductBundle {
  id: string
  name: string
  description: string
  products: BundleProduct[]
  bundlePrice: number
  individualTotal: number
  savings: number
  savingsPercentage: number
  image?: string
  isPopular?: boolean
  category?: string
}

interface ProductBundlesProps {
  productId?: string
  categoryId?: string
  limit?: number
  title?: string
  className?: string
}

export function ProductBundles({
  productId,
  categoryId,
  limit = 3,
  title = 'Buy Together and Save',
  className,
}: ProductBundlesProps) {
  const [bundles, setBundles] = useState<ProductBundle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBundles, setSelectedBundles] = useState<Set<string>>(new Set())
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    const fetchBundles = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would fetch from API
        // For now, we'll create bundles from related products
        const response = await fetch(
          `/api/products?category=${categoryId || ''}&limit=${limit * 2}`
        )
        const data = await response.json()
        const products = (data.products || []).filter(
          (p: any) => p.id !== productId
        )

        // Create bundles (2-3 products each)
        const createdBundles: ProductBundle[] = []
        for (
          let i = 0;
          i < Math.min(limit, Math.floor(products.length / 2));
          i++
        ) {
          const bundleProducts = products.slice(i * 2, i * 2 + 2)
          if (bundleProducts.length >= 2) {
            const individualTotal = bundleProducts.reduce(
              (sum: number, p: any) => sum + Number(p.price),
              0
            )
            const bundlePrice = individualTotal * 0.85 // 15% discount
            const savings = individualTotal - bundlePrice
            const savingsPercentage = Math.round(
              (savings / individualTotal) * 100
            )

            createdBundles.push({
              id: `bundle-${i}`,
              name: `${bundleProducts[0].name} + ${bundleProducts[1].name}`,
              description: 'Perfect combination for better results',
              products: bundleProducts.map((p: any) => ({
                id: p.id,
                product_id: p.id,
                name: p.name,
                slug: p.slug || p.id,
                price: Number(p.price),
                compare_at_price: p.compare_at_price
                  ? Number(p.compare_at_price)
                  : undefined,
                image: p.image || '📦',
                short_description: p.short_description,
                inStock: p.inStock,
                rating: p.rating,
                reviews_count: p.reviews_count,
              })),
              bundlePrice,
              individualTotal,
              savings,
              savingsPercentage,
              isPopular: i === 0,
            })
          }
        }

        setBundles(createdBundles)
      } catch (error) {
        console.error('Error fetching bundles:', error)
        setBundles([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBundles()
  }, [productId, categoryId, limit])

  const handleAddBundle = (bundle: ProductBundle) => {
    bundle.products.forEach((product) => {
      if (product.inStock) {
        addToCart({
          id: product.id,
          product_id: product.product_id,
          name: product.name,
          price: product.price,
          image: product.image || '📦',
          sku: product.sku,
        })
      }
    })

    toast.success(
      `Bundle added to cart! You saved Rs. ${bundle.savings.toFixed(2)}`,
      {
        duration: 5000,
      }
    )
  }

  const toggleBundleSelection = (bundleId: string) => {
    setSelectedBundles((prev) => {
      const next = new Set(prev)
      if (next.has(bundleId)) {
        next.delete(bundleId)
      } else {
        next.add(bundleId)
      }
      return next
    })
  }

  const handleAddSelectedBundles = () => {
    selectedBundles.forEach((bundleId) => {
      const bundle = bundles.find((b) => b.id === bundleId)
      if (bundle) {
        handleAddBundle(bundle)
      }
    })
    setSelectedBundles(new Set())
  }

  if (isLoading) {
    return (
      <div className={cn('py-8', className)}>
        <div className="container px-4">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(limit)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-32 bg-gray-200 rounded-lg mb-3" />
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

  if (bundles.length === 0) return null

  return (
    <div className={cn('py-8 bg-white', className)}>
      <div className="container px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
          {selectedBundles.size > 0 && (
            <Button
              onClick={handleAddSelectedBundles}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add {selectedBundles.size} Bundle
              {selectedBundles.size !== 1 ? 's' : ''} to Cart
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => {
            const isSelected = selectedBundles.has(bundle.id)
            const priceDisplay = getPriceDisplay(
              bundle.bundlePrice,
              bundle.individualTotal
            )

            return (
              <Card
                key={bundle.id}
                className={cn(
                  'border-2 transition-all relative overflow-hidden',
                  isSelected
                    ? 'border-orange-500 shadow-lg'
                    : 'border-gray-200 hover:border-orange-300'
                )}
              >
                {bundle.isPopular && (
                  <Badge className="absolute top-2 right-2 z-10 bg-gradient-to-r from-orange-500 to-orange-600">
                    Popular
                  </Badge>
                )}

                <CardContent className="p-6">
                  {/* Bundle Header */}
                  <div className="mb-4">
                    <h3 className="font-bold text-lg mb-2">{bundle.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {bundle.description}
                    </p>

                    {/* Price Display */}
                    <div className="space-y-1 mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-orange-600">
                          {priceDisplay.current}
                        </span>
                        {priceDisplay.original && (
                          <span className="text-lg text-gray-400 line-through">
                            {priceDisplay.original}
                          </span>
                        )}
                      </div>
                      {priceDisplay.savings && (
                        <p className="text-sm font-semibold text-green-600">
                          {priceDisplay.savings}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Products in Bundle */}
                  <div className="space-y-3 mb-4">
                    {bundle.products.map((product, index) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="relative w-16 h-16 bg-white rounded overflow-hidden flex-shrink-0">
                          {product.image && product.image.startsWith('http') ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-contain"
                              sizes="64px"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-xl">
                                {product.image || '📦'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${product.slug}`}
                            className="block"
                          >
                            <h4 className="font-semibold text-sm text-gray-900 truncate hover:text-orange-600">
                              {product.name}
                            </h4>
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            {product.rating && product.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-gray-600">
                                  {Number(product.rating).toFixed(1)}
                                </span>
                              </div>
                            )}
                            <span className="text-xs font-semibold text-orange-600">
                              {getPriceDisplay(product.price).current}
                            </span>
                          </div>
                        </div>
                        {index < bundle.products.length - 1 && (
                          <span className="text-gray-400 text-xl">+</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Select Checkbox */}
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id={`bundle-${bundle.id}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleBundleSelection(bundle.id)}
                    />
                    <label
                      htmlFor={`bundle-${bundle.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      Select this bundle
                    </label>
                  </div>
                </CardContent>

                <CardFooter className="pt-0 px-6 pb-6 flex gap-2">
                  <Button
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    onClick={() => handleAddBundle(bundle)}
                    disabled={!bundle.products.every((p) => p.inStock)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add Bundle
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}









