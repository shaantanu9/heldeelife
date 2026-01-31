'use client'

import { useComparison } from '@/contexts/comparison-context'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import Link from 'next/link'
import {
  Scale,
  X,
  ShoppingCart,
  Heart,
  Star,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { EmptyState } from '@/components/mobile/empty-states'

export default function ComparePage() {
  const { comparison, removeFromComparison, clearComparison } = useComparison()
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()

  if (comparison.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
        <div className="container px-4">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
          <EmptyState
            type="search"
            title="No Products to Compare"
            description="Add products to comparison to see them side by side. You can compare up to 4 products at once."
          />
        </div>
      </div>
    )
  }

  // Get all unique keys from all products for comparison
  const getComparisonKeys = () => {
    const keys = new Set<string>()
    comparison.forEach((product) => {
      keys.add('price')
      keys.add('rating')
      keys.add('reviews')
      keys.add('stock')
      keys.add('category')
      if (product.benefits) keys.add('benefits')
      if (product.ingredients) keys.add('ingredients')
      if (product.usage_instructions) keys.add('usage')
      if (product.storage_instructions) keys.add('storage')
      if (product.manufacturer) keys.add('manufacturer')
      if (product.weight) keys.add('weight')
    })
    return Array.from(keys)
  }

  const comparisonKeys = getComparisonKeys()

  const handleAddToCart = (product: (typeof comparison)[0]) => {
    addToCart({
      id: product.id,
      product_id: product.product_id,
      name: product.name,
      price: product.price,
      image: product.image || '📦',
      sku: product.sku,
    })
    toast.success(`${product.name} added to cart`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Shop
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Product <span className="text-orange-600">Comparison</span>
            </h1>
            <p className="text-gray-600 mt-2">
              Compare {comparison.length} product
              {comparison.length !== 1 ? 's' : ''} side by side
            </p>
          </div>
          <Button
            variant="outline"
            onClick={clearComparison}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {comparison.map((product) => (
            <Card key={product.id} className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white shadow-md"
                onClick={() => removeFromComparison(product.id)}
              >
                <X className="h-4 w-4" />
              </Button>

              <CardContent className="p-6">
                <Link href={`/products/${product.slug}`} className="block mb-4">
                  <div className="aspect-square bg-orange-50 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                    {product.image && product.image.startsWith('http') ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 25vw"
                        unoptimized
                      />
                    ) : (
                      <span className="text-6xl opacity-70">
                        {product.image || '📦'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-orange-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price</span>
                    <div>
                      <span className="font-bold text-orange-600 text-lg">
                        Rs. {Number(product.price).toFixed(2)}
                      </span>
                      {product.compare_at_price && (
                        <span className="text-gray-400 line-through text-sm ml-2">
                          Rs. {Number(product.compare_at_price).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {product.rating && product.rating > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">
                          {Number(product.rating).toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({product.reviews_count || 0})
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stock</span>
                    {product.inStock ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        In Stock
                        {product.stockQuantity !== undefined &&
                          ` (${product.stockQuantity})`}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Out of Stock
                      </Badge>
                    )}
                  </div>

                  {product.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Category</span>
                      <span className="text-sm">{product.category}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.inStock}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/products/${product.slug}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        toggleWishlist({
                          id: product.id,
                          product_id: product.product_id,
                          name: product.name,
                          price: product.price,
                          image: product.image || '📦',
                          slug: product.slug,
                        })
                      }
                    >
                      <Heart
                        className={cn(
                          'h-4 w-4',
                          isInWishlist(product.id)
                            ? 'fill-red-500 text-red-500'
                            : ''
                        )}
                      />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Comparison Table */}
        <Separator className="my-8" />
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Detailed Comparison
          </h2>
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-semibold text-sm text-gray-700">
                    Feature
                  </th>
                  {comparison.map((product) => (
                    <th
                      key={product.id}
                      className="text-left p-4 font-semibold text-sm text-gray-700 min-w-[200px]"
                    >
                      {product.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonKeys.map((key, index) => (
                  <tr
                    key={key}
                    className={cn(
                      'border-b',
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    )}
                  >
                    <td className="p-4 text-sm font-medium text-gray-700 capitalize">
                      {key === 'usage' ? 'Usage Instructions' : key}
                    </td>
                    {comparison.map((product) => (
                      <td key={product.id} className="p-4 text-sm">
                        {key === 'price' && (
                          <div>
                            <span className="font-semibold text-orange-600">
                              Rs. {Number(product.price).toFixed(2)}
                            </span>
                            {product.compare_at_price && (
                              <span className="text-gray-400 line-through text-xs ml-2">
                                Rs.{' '}
                                {Number(product.compare_at_price).toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                        {key === 'rating' && (
                          <div className="flex items-center gap-1">
                            {product.rating ? (
                              <>
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{Number(product.rating).toFixed(1)}</span>
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        )}
                        {key === 'reviews' && (
                          <span>{product.reviews_count || 0} reviews</span>
                        )}
                        {key === 'stock' && (
                          <div>
                            {product.inStock ? (
                              <Badge variant="default" className="text-xs">
                                In Stock
                                {product.stockQuantity !== undefined &&
                                  ` (${product.stockQuantity})`}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Out of Stock
                              </Badge>
                            )}
                          </div>
                        )}
                        {key === 'category' && (
                          <span>{product.category || '—'}</span>
                        )}
                        {key === 'benefits' && (
                          <div className="space-y-1">
                            {product.benefits && product.benefits.length > 0 ? (
                              product.benefits.slice(0, 5).map((benefit, i) => (
                                <div key={i} className="text-xs">
                                  • {benefit}
                                </div>
                              ))
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        )}
                        {key === 'ingredients' && (
                          <div className="line-clamp-3 text-xs">
                            {product.ingredients || '—'}
                          </div>
                        )}
                        {key === 'usage' && (
                          <div className="line-clamp-3 text-xs">
                            {product.usage_instructions || '—'}
                          </div>
                        )}
                        {key === 'storage' && (
                          <div className="line-clamp-3 text-xs">
                            {product.storage_instructions || '—'}
                          </div>
                        )}
                        {key === 'manufacturer' && (
                          <span className="text-xs">
                            {product.manufacturer || '—'}
                          </span>
                        )}
                        {key === 'weight' && (
                          <span className="text-xs">
                            {product.weight ? `${product.weight} g` : '—'}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}









