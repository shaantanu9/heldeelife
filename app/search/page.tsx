'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { ComparisonButton } from '@/components/conversion/product-comparison'
import { AdvancedSearch } from '@/components/search/advanced-search'
import { QuickViewModal } from '@/components/conversion/quick-view-modal'
import { UrgencyIndicator } from '@/components/conversion/urgency-indicator'
import { SocialProof } from '@/components/conversion/social-proof'
import { ProductGridSkeleton } from '@/components/mobile/skeleton-loaders'
import { EmptyState } from '@/components/mobile/empty-states'
import Link from 'next/link'
import Image from 'next/image'
import {
  Heart,
  Eye,
  Star,
  SlidersHorizontal,
  TrendingUp,
  DollarSign,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

type SortOption =
  | 'relevance'
  | 'price-low'
  | 'price-high'
  | 'rating'
  | 'newest'
  | 'popular'

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
  views_count?: number
  product_categories?: {
    name: string
    slug: string
  }
  sku?: string
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [showInStockOnly, setShowInStockOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()

  // Get search query from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) {
      setSearchQuery(q)
      handleSearch(q)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProducts([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/products?search=${encodeURIComponent(query)}`
      )
      const data = await response.json()
      setProducts((data.products || []).map((p: any) => ({ ...p, product_id: p.product_id || p.id })))
    } catch (error) {
      console.error('Search error:', error)
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery)
    }
  }, [searchQuery, handleSearch])

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products]

    // Filter by stock
    if (showInStockOnly) {
      filtered = filtered.filter((p) => p.inStock)
    }

    // Filter by price range
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    )

    // Filter by rating
    if (minRating > 0) {
      filtered = filtered.filter((p) => (p.rating || 0) >= minRating)
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'newest':
          return 0 // Already sorted by newest from API
        case 'popular':
          return (b.sales_count || 0) - (a.sales_count || 0)
        case 'relevance':
        default:
          return 0 // Keep original order for relevance
      }
    })

    return filtered
  }, [products, sortBy, priceRange, showInStockOnly, minRating])

  // Calculate price range from products
  const maxPrice = useMemo(() => {
    if (products.length === 0) return 10000
    return Math.max(...products.map((p) => p.price), 10000)
  }, [products])

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

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product)
  }

  const activeFiltersCount =
    (showInStockOnly ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
          Search <span className="text-orange-600">Products</span>
        </h1>

        {/* Advanced Search */}
        <div className="mb-8">
          <AdvancedSearch autoFocus />
        </div>

        {/* Results */}
        {searchQuery && (
          <div>
            {/* Results Header with Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-4">
                <p className="text-gray-600">
                  Found{' '}
                  <span className="font-semibold text-gray-900">
                    {filteredAndSortedProducts.length}
                  </span>{' '}
                  result{filteredAndSortedProducts.length !== 1 ? 's' : ''} for{' '}
                  <span className="font-semibold text-orange-600">
                    &quot;{searchQuery}&quot;
                  </span>
                </p>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <SlidersHorizontal className="h-3 w-3" />
                    {activeFiltersCount} filter
                    {activeFiltersCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Mobile Filter Button */}
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="sm:hidden" size="sm">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                        >
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle>Filter Products</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      {/* Price Range */}
                      <div>
                        <Label className="mb-3 block">
                          Price Range: Rs. {priceRange[0]} - Rs. {priceRange[1]}
                        </Label>
                        <Slider
                          value={priceRange}
                          onValueChange={(value) => setPriceRange(value as [number, number])}
                          max={maxPrice}
                          min={0}
                          step={100}
                          className="w-full"
                        />
                      </div>

                      {/* In Stock Only */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="inStock"
                          checked={showInStockOnly}
                          onCheckedChange={(checked) =>
                            setShowInStockOnly(checked === true)
                          }
                        />
                        <Label
                          htmlFor="inStock"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          In Stock Only
                        </Label>
                      </div>

                      {/* Minimum Rating */}
                      <div>
                        <Label className="mb-3 block">
                          Minimum Rating:{' '}
                          {minRating > 0 ? `${minRating}+ stars` : 'Any'}
                        </Label>
                        <div className="flex gap-2">
                          {[0, 3, 4, 4.5].map((rating) => (
                            <Button
                              key={rating}
                              variant={
                                minRating === rating ? 'default' : 'outline'
                              }
                              size="sm"
                              onClick={() => setMinRating(rating)}
                              className="flex items-center gap-1"
                            >
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {rating > 0 ? rating : 'Any'}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Desktop Filters */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="inStockDesktop"
                      checked={showInStockOnly}
                      onCheckedChange={(checked) =>
                        setShowInStockOnly(checked === true)
                      }
                    />
                    <Label
                      htmlFor="inStockDesktop"
                      className="text-sm cursor-pointer"
                    >
                      In Stock Only
                    </Label>
                  </div>
                </div>

                {/* Sort */}
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as SortOption)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Most Relevant</SelectItem>
                    <SelectItem value="price-low">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-high">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <ProductGridSkeleton count={6} />
            ) : filteredAndSortedProducts.length === 0 ? (
              <EmptyState
                type="search"
                title={`No results for "${searchQuery}"`}
                description="Try different keywords, check your spelling, or adjust your filters to find what you're looking for."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedProducts.map((product) => {
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
                      {/* Wishlist & Comparison Buttons */}
                      <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="bg-white/90 hover:bg-white shadow-md"
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
                              inWishlist
                                ? 'fill-red-500 text-red-500'
                                : 'text-gray-600'
                            )}
                          />
                        </Button>
                        <ComparisonButton product={{...product, product_id: product.id}} variant="icon" />
                      </div>

                      {/* Quick View Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 left-2 z-10 bg-white/90 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleQuickView(product)}
                      >
                        <Eye className="h-5 w-5 text-gray-600" />
                      </Button>

                      {/* Discount Badge */}
                      {discountPercentage > 0 && (
                        <Badge className="absolute top-2 left-2 z-10 bg-red-600 text-white">
                          {discountPercentage}% OFF
                        </Badge>
                      )}

                      <Link href={`/products/${product.slug || product.id}`}>
                        <CardContent className="p-6">
                          <div className="aspect-square bg-orange-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors relative overflow-hidden">
                            {product.image &&
                            product.image.startsWith('http') ? (
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                unoptimized
                              />
                            ) : (
                              <span className="text-6xl opacity-70">
                                {product.image || '📦'}
                              </span>
                            )}
                          </div>

                          <h3 className="font-semibold text-lg mb-2 text-gray-900 leading-snug line-clamp-2 min-h-[3.5rem]">
                            {product.name}
                          </h3>

                          {/* Rating */}
                          {product.rating && product.rating > 0 && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      'h-4 w-4',
                                      i < Math.round(product.rating || 0)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'fill-gray-200 text-gray-200'
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">
                                ({product.reviews_count || 0})
                              </span>
                            </div>
                          )}

                          {/* Price */}
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-orange-600 font-bold text-xl">
                              Rs. {Number(product.price).toFixed(2)}
                            </p>
                            {product.compare_at_price && (
                              <p className="text-gray-400 line-through text-sm">
                                Rs.{' '}
                                {Number(product.compare_at_price).toFixed(2)}
                              </p>
                            )}
                          </div>

                          {/* Category */}
                          {product.product_categories && (
                            <p className="text-xs text-gray-500 mb-2">
                              {product.product_categories.name}
                            </p>
                          )}

                          {/* Urgency & Social Proof */}
                          <div className="space-y-1">
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
                            />
                          </div>
                        </CardContent>
                      </Link>

                      <CardFooter className="pt-0 px-6 pb-6 flex gap-2">
                        <Button
                          className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                          onClick={(e) => {
                            e.preventDefault()
                            handleAddToCart(product)
                          }}
                          disabled={!product.inStock}
                        >
                          {product.inStock ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Add to Cart
                            </>
                          ) : (
                            'Out of Stock'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault()
                            handleQuickView(product)
                          }}
                          className="flex-shrink-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {!searchQuery && (
          <div className="text-center py-16">
            <p className="text-gray-600 mb-2">
              Start typing to search for products
            </p>
            <p className="text-sm text-gray-500">
              Search by product name, symptoms, or health concerns
            </p>
          </div>
        )}
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
