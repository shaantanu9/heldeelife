'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useComparison } from '@/contexts/comparison-context'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ComparisonButtonProps {
  product: {
    id: string
    product_id: string
    name: string
    slug: string
    price: number
    compare_at_price?: number
    image: string
    short_description?: string
    description?: string
    inStock: boolean
    stockQuantity?: number
    rating?: number
    reviews_count?: number
    sales_count?: number
    sku?: string
    category?: string
    benefits?: string[]
    ingredients?: string
    usage_instructions?: string
    storage_instructions?: string
    manufacturer?: string
    weight?: number
    dimensions?: any
  }
  variant?: 'default' | 'icon' | 'text'
  className?: string
}

export function ComparisonButton({
  product,
  variant = 'default',
  className,
}: ComparisonButtonProps) {
  const { addToComparison, isInComparison, removeFromComparison } =
    useComparison()
  const inComparison = isInComparison(product.id)

  const handleToggle = () => {
    if (inComparison) {
      removeFromComparison(product.id)
    } else {
      addToComparison(product)
    }
  }

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className={cn(
          'relative',
          inComparison && 'bg-orange-50 text-orange-600',
          className
        )}
        title={inComparison ? 'Remove from comparison' : 'Add to comparison'}
      >
        <Scale className="h-4 w-4" />
        {inComparison && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-orange-600 rounded-full border-2 border-white" />
        )}
      </Button>
    )
  }

  if (variant === 'text') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className={cn(
          'gap-2',
          inComparison && 'bg-orange-50 text-orange-600',
          className
        )}
      >
        <Scale className="h-4 w-4" />
        {inComparison ? 'Remove from Compare' : 'Add to Compare'}
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className={cn(
        'gap-2',
        inComparison && 'bg-orange-50 border-orange-200 text-orange-600',
        className
      )}
    >
      <Scale className="h-4 w-4" />
      {inComparison ? 'In Comparison' : 'Compare'}
    </Button>
  )
}

export function ComparisonModal() {
  const { comparison, removeFromComparison, clearComparison, totalItems } =
    useComparison()
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [isOpen, setIsOpen] = useState(false)

  if (totalItems === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Scale className="h-4 w-4" />
            Compare ({totalItems})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Product Comparison</DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <Scale className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-2">No products to compare</p>
            <p className="text-sm text-gray-500">
              Add products to comparison to see them side by side
            </p>
          </div>
        </DialogContent>
      </Dialog>
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <Scale className="h-4 w-4" />
          Compare ({totalItems})
          {totalItems > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0" hideCloseButton>
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Product Comparison</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearComparison}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
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

                <CardContent className="p-4">
                  <Link
                    href={`/products/${product.slug}`}
                    className="block mb-3"
                  >
                    <div className="aspect-square bg-orange-50 rounded-lg flex items-center justify-center mb-3 relative overflow-hidden">
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
                        <span className="text-4xl opacity-70">
                          {product.image || '📦'}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Price</span>
                      <span className="font-bold text-orange-600">
                        Rs. {Number(product.price).toFixed(2)}
                      </span>
                    </div>

                    {product.rating && product.rating > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-semibold">
                            {Number(product.rating).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Stock</span>
                      {product.inStock ? (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          In Stock
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Button
                      className="w-full text-sm"
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.inStock}
                    >
                      <ShoppingCart className="h-3 w-3 mr-2" />
                      Add to Cart
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/products/${product.slug}`}>
                          <ExternalLink className="h-3 w-3 mr-2" />
                          View
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
                            'h-3 w-3',
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
          <Separator className="my-6" />
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-4">Detailed Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold text-sm">
                      Feature
                    </th>
                    {comparison.map((product) => (
                      <th
                        key={product.id}
                        className="text-left p-2 font-semibold text-sm min-w-[150px]"
                      >
                        {product.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonKeys.map((key) => (
                    <tr key={key} className="border-b">
                      <td className="p-2 text-sm font-medium text-gray-700 capitalize">
                        {key === 'usage' ? 'Usage Instructions' : key}
                      </td>
                      {comparison.map((product) => (
                        <td key={product.id} className="p-2 text-sm">
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
                                  <span>
                                    {Number(product.rating).toFixed(1)}
                                  </span>
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
                              {product.benefits &&
                              product.benefits.length > 0 ? (
                                product.benefits
                                  .slice(0, 3)
                                  .map((benefit, i) => (
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
                            <div className="line-clamp-2 text-xs">
                              {product.ingredients || '—'}
                            </div>
                          )}
                          {key === 'usage' && (
                            <div className="line-clamp-2 text-xs">
                              {product.usage_instructions || '—'}
                            </div>
                          )}
                          {key === 'storage' && (
                            <div className="line-clamp-2 text-xs">
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

