'use client'

import { useState, useTransition, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { ComparisonButton } from '@/components/conversion/product-comparison'
import { ProductGridSkeleton } from '@/components/mobile/skeleton-loaders'
import { EmptyState } from '@/components/mobile/empty-states'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search,
  Loader2,
  ShoppingCart,
  X,
  SlidersHorizontal,
  Heart,
  Star,
  Shield,
  Truck,
  RotateCcw,
  TrendingUp,
  Users,
  Eye,
  Sparkles,
  Grid3x3,
  List,
  Home,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

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
  is_featured?: boolean
  product_categories?: {
    name: string
    slug: string
  }
}

interface Category {
  id: string
  name: string
  slug: string
}

interface ShopClientProps {
  products: Product[]
  categories: Category[]
}

type SortOption =
  | 'newest'
  | 'price-low'
  | 'price-high'
  | 'name-asc'
  | 'name-desc'
  | 'rating'
  | 'popular'

// Star Rating Component
function StarRating({
  rating,
  reviewsCount,
}: {
  rating?: number
  reviewsCount?: number
}) {
  const stars = Math.round((rating || 0) * 2) / 2 // Round to nearest 0.5
  const fullStars = Math.floor(stars)
  const hasHalfStar = stars % 1 !== 0

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-3.5 w-3.5',
              i < fullStars
                ? 'fill-yellow-400 text-yellow-400'
                : i === fullStars && hasHalfStar
                  ? 'fill-yellow-400/50 text-yellow-400'
                  : 'fill-gray-200 text-gray-200'
            )}
          />
        ))}
      </div>
      {rating && rating > 0 && (
        <span className="text-xs text-gray-600 ml-1">
          {stars.toFixed(1)}
          {reviewsCount !== undefined && reviewsCount > 0 && (
            <span className="text-gray-500"> ({reviewsCount})</span>
          )}
        </span>
      )}
    </div>
  )
}

function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    if (!product.inStock) return

    setIsAdding(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      addToCart({
        id: product.id,
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image || '📦',
      })
      toast.success('Added to cart!', {
        description: product.name,
        action: {
          label: 'View Cart',
          onClick: () => router.push('/cart'),
        },
      })
    } catch (error) {
      toast.error('Failed to add item to cart')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Button
      className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={handleAddToCart}
      disabled={isAdding || !product.inStock}
    >
      {isAdding ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Adding...
        </>
      ) : product.inStock ? (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to cart
        </>
      ) : (
        'Out of Stock'
      )}
    </Button>
  )
}

function WishlistButton({ product }: { product: Product }) {
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [isLoading, setIsLoading] = useState(false)
  const inWishlist = isInWishlist(product.id)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLoading(true)

    try {
      toggleWishlist({
        id: product.id,
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image || '📦',
      })
    } catch (error) {
      toast.error('Failed to update wishlist')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-2 right-2 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white hover:shadow-lg transition-all z-10"
      onClick={handleToggle}
      disabled={isLoading}
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-colors',
          inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'
        )}
      />
    </Button>
  )
}

function FilterSidebar({
  categories,
  selectedCategories,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  inStockOnly,
  onInStockChange,
  minRating,
  onMinRatingChange,
  onSaleOnly,
  onOnSaleChange,
  onClearFilters,
  productCount,
  maxPrice,
}: {
  categories: Category[]
  selectedCategories: string[]
  onCategoryChange: (category: string, checked: boolean) => void
  priceRange: [number, number]
  onPriceRangeChange: (range: [number, number]) => void
  inStockOnly: boolean
  onInStockChange: (checked: boolean) => void
  minRating: number
  onMinRatingChange: (rating: number) => void
  onSaleOnly: boolean
  onOnSaleChange: (checked: boolean) => void
  onClearFilters: () => void
  productCount: number
  maxPrice: number
}) {
  return (
    <div className="w-full lg:w-64 space-y-6">
      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">
          {productCount} {productCount === 1 ? 'product' : 'products'}
        </p>
      </div>

      <Separator />

      {/* Clear Filters */}
      <Button
        variant="outline"
        size="sm"
        onClick={onClearFilters}
        className="w-full"
      >
        <X className="h-4 w-4 mr-2" />
        Clear Filters
      </Button>

      <Separator />

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Price Range</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => onPriceRangeChange([value[0], value[1]])}
            min={0}
            max={maxPrice}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Rs. {priceRange[0].toLocaleString()}</span>
            <span>Rs. {priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Categories */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Categories</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={selectedCategories.includes(category.slug)}
                onCheckedChange={(checked) =>
                  onCategoryChange(category.slug, checked as boolean)
                }
              />
              <label
                htmlFor={`category-${category.id}`}
                className="text-sm text-gray-700 cursor-pointer flex-1"
              >
                {category.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Stock Availability */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Availability</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="in-stock"
            checked={inStockOnly}
            onCheckedChange={(checked) => onInStockChange(checked as boolean)}
          />
          <label
            htmlFor="in-stock"
            className="text-sm text-gray-700 cursor-pointer"
          >
            In Stock Only
          </label>
        </div>
      </div>

      <Separator />

      {/* Rating Filter */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Rating</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={minRating === rating}
                onCheckedChange={(checked) =>
                  onMinRatingChange(checked ? rating : 0)
                }
              />
              <label
                htmlFor={`rating-${rating}`}
                className="text-sm text-gray-700 cursor-pointer flex items-center gap-1"
              >
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-3 w-3',
                        i < rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                      )}
                    />
                  ))}
                </div>
                <span className="ml-1">& Up</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Discount Filter */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Deals</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="on-sale"
            checked={onSaleOnly}
            onCheckedChange={(checked) => onOnSaleChange(checked as boolean)}
          />
          <label
            htmlFor="on-sale"
            className="text-sm text-gray-700 cursor-pointer"
          >
            On Sale Only
          </label>
        </div>
      </div>
    </div>
  )
}

// Trust Badges Banner
function TrustBadgesBanner() {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 py-3 mb-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-green-700">
            <Shield className="h-4 w-4" />
            <span className="font-semibold">Secure Payment</span>
          </div>
          <div className="flex items-center gap-2 text-blue-700">
            <Truck className="h-4 w-4" />
            <span className="font-semibold">Free Shipping</span>
          </div>
          <div className="flex items-center gap-2 text-purple-700">
            <RotateCcw className="h-4 w-4" />
            <span className="font-semibold">Easy Returns</span>
          </div>
          <div className="flex items-center gap-2 text-orange-700">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">Authentic Products</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Product Card
function ProductCard({ product }: { product: Product }) {
  const discountPercentage = useMemo(() => {
    if (
      !product.compare_at_price ||
      product.compare_at_price <= product.price
    ) {
      return 0
    }
    return Math.round(
      ((Number(product.compare_at_price) - Number(product.price)) /
        Number(product.compare_at_price)) *
        100
    )
  }, [product.compare_at_price, product.price])

  const isLowStock =
    product.stockQuantity &&
    product.stockQuantity > 0 &&
    product.stockQuantity < 10
  const isVeryLowStock =
    product.stockQuantity &&
    product.stockQuantity > 0 &&
    product.stockQuantity < 5

  const [imageError, setImageError] = useState(false)

  return (
    <Card className="group relative border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 bg-white overflow-hidden">
      <Link href={`/products/${product.slug}`} className="block">
        <CardContent className="p-0 relative">
          {/* Badges */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-2">
            {product.is_featured && (
              <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-md">
                <Sparkles className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            {discountPercentage > 0 && (
              <Badge variant="destructive" className="shadow-md">
                {discountPercentage}% OFF
              </Badge>
            )}
            {isVeryLowStock && (
              <Badge variant="destructive" className="shadow-md animate-pulse">
                Only {product.stockQuantity} left!
              </Badge>
            )}
            {isLowStock && !isVeryLowStock && (
              <Badge className="bg-orange-500 text-white border-0 shadow-md">
                Low Stock
              </Badge>
            )}
          </div>

          {/* Wishlist & Comparison Buttons */}
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <WishlistButton product={product} />
            <ComparisonButton product={product} variant="icon" />
          </div>

          {/* Product Image */}
          <div className="aspect-square bg-gradient-to-br from-orange-50 to-orange-100 relative overflow-hidden">
            {product.image &&
            !imageError &&
            product.image.startsWith('http') ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl opacity-70">📦</span>
              </div>
            )}
            {!product.inStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                <Badge
                  variant="destructive"
                  className="text-sm font-semibold px-4 py-2"
                >
                  Out of Stock
                </Badge>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4 space-y-2">
            {/* Category */}
            {product.product_categories && (
              <Badge variant="secondary" className="text-xs">
                {product.product_categories.name}
              </Badge>
            )}

            {/* Product Name */}
            <h3 className="font-semibold text-base text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-orange-600 transition-colors">
              {product.name}
            </h3>

            {/* Rating */}
            {product.rating && product.rating > 0 && (
              <StarRating
                rating={product.rating}
                reviewsCount={product.reviews_count}
              />
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-bold text-orange-600">
                Rs. {Number(product.price).toLocaleString()}
              </span>
              {product.compare_at_price &&
                product.compare_at_price > product.price && (
                  <>
                    <span className="text-sm text-gray-400 line-through">
                      Rs. {Number(product.compare_at_price).toLocaleString()}
                    </span>
                  </>
                )}
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
              {product.sales_count && product.sales_count > 0 && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>{product.sales_count}+ sold</span>
                </div>
              )}
              {product.views_count && product.views_count > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{product.views_count} views</span>
                </div>
              )}
            </div>

            {/* Short Description */}
            {product.short_description && (
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                {product.short_description}
              </p>
            )}
          </div>
        </CardContent>
      </Link>

      {/* Add to Cart Button */}
      <CardFooter className="pt-0 px-4 pb-4">
        <AddToCartButton product={product} />
      </CardFooter>
    </Card>
  )
}

export function ShopClient({ products, categories }: ShopClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  )
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'newest'
  )
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const category = searchParams.get('category')
    return category ? [category] : []
  })

  // Calculate max price from products
  const maxPrice = useMemo(() => {
    if (products.length === 0) return 10000
    return Math.max(...products.map((p) => Number(p.price)), 10000)
  }, [products])

  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    const min = searchParams.get('minPrice')
    const max = searchParams.get('maxPrice')
    const defaultMax = 10000
    return [min ? parseInt(min) : 0, max ? parseInt(max) : defaultMax]
  })

  const [inStockOnly, setInStockOnly] = useState(() => {
    return searchParams.get('inStock') === 'true'
  })

  const [minRating, setMinRating] = useState(() => {
    const rating = searchParams.get('minRating')
    return rating ? parseFloat(rating) : 0
  })

  const [onSaleOnly, setOnSaleOnly] = useState(() => {
    return searchParams.get('onSale') === 'true'
  })

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shop-view-mode')
      return (saved as 'grid' | 'list') || 'grid'
    }
    return 'grid'
  })

  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 12

  // Update price range max when maxPrice changes (if not set from URL)
  useEffect(() => {
    const maxFromUrl = searchParams.get('maxPrice')
    if (!maxFromUrl && priceRange[1] === 10000 && maxPrice !== 10000) {
      setPriceRange([priceRange[0], maxPrice])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxPrice])

  // Update price range max if needed
  const currentPriceRange = useMemo((): [number, number] => {
    return [priceRange[0], Math.min(priceRange[1], maxPrice)]
  }, [priceRange, maxPrice])

  // Get featured products
  const featuredProducts = useMemo(() => {
    return products.filter((p) => p.is_featured).slice(0, 6)
  }, [products])

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.short_description?.toLowerCase().includes(query) ||
          product.product_categories?.name.toLowerCase().includes(query)
      )
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(
        (product) =>
          product.product_categories &&
          selectedCategories.includes(product.product_categories.slug)
      )
    }

    // Filter by price range
    filtered = filtered.filter(
      (product) =>
        Number(product.price) >= currentPriceRange[0] &&
        Number(product.price) <= currentPriceRange[1]
    )

    // Filter by stock
    if (inStockOnly) {
      filtered = filtered.filter((product) => product.inStock)
    }

    // Filter by rating
    if (minRating > 0) {
      filtered = filtered.filter(
        (product) => (product.rating || 0) >= minRating
      )
    }

    // Filter by discount/sale
    if (onSaleOnly) {
      filtered = filtered.filter(
        (product) =>
          product.compare_at_price && product.compare_at_price > product.price
      )
    }

    // Sort products
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return Number(a.price) - Number(b.price)
        case 'price-high':
          return Number(b.price) - Number(a.price)
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'popular':
          return (b.sales_count || 0) - (a.sales_count || 0)
        case 'newest':
        default:
          return 0 // Already sorted by newest from server
      }
    })

    return sorted
  }, [
    products,
    searchQuery,
    selectedCategories,
    currentPriceRange,
    inStockOnly,
    minRating,
    onSaleOnly,
    sortBy,
  ])

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedProducts.length / productsPerPage
  )
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage
    const end = start + productsPerPage
    return filteredAndSortedProducts.slice(start, end)
  }, [filteredAndSortedProducts, currentPage])

  // Save view mode to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('shop-view-mode', viewMode)
    }
  }, [viewMode])

  // Update URL params when filters change
  const updateURLParams = useCallback(
    (updates: {
      categories?: string[]
      priceRange?: [number, number]
      inStock?: boolean
      sort?: SortOption
      search?: string
    }) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())

        if (updates.categories !== undefined) {
          if (updates.categories.length === 0) {
            params.delete('category')
          } else if (updates.categories.length === 1) {
            params.set('category', updates.categories[0])
          } else {
            params.set('category', updates.categories[0])
          }
        }

        if (updates.priceRange) {
          if (updates.priceRange[0] > 0) {
            params.set('minPrice', updates.priceRange[0].toString())
          } else {
            params.delete('minPrice')
          }
          if (updates.priceRange[1] < maxPrice) {
            params.set('maxPrice', updates.priceRange[1].toString())
          } else {
            params.delete('maxPrice')
          }
        }

        if (updates.inStock !== undefined) {
          if (updates.inStock) {
            params.set('inStock', 'true')
          } else {
            params.delete('inStock')
          }
        }

        if (updates.sort) {
          if (updates.sort !== 'newest') {
            params.set('sort', updates.sort)
          } else {
            params.delete('sort')
          }
        }

        if (updates.search !== undefined) {
          if (updates.search) {
            params.set('search', updates.search)
          } else {
            params.delete('search')
          }
        }

        router.push(`/shop?${params.toString()}`)
      })
    },
    [searchParams, router, maxPrice]
  )

  const handleCategoryChange = useCallback(
    (category: string, checked: boolean) => {
      const newCategories = checked
        ? [...selectedCategories, category]
        : selectedCategories.filter((c) => c !== category)
      setSelectedCategories(newCategories)
      updateURLParams({ categories: newCategories })
    },
    [selectedCategories, updateURLParams]
  )

  const handlePriceRangeChange = useCallback(
    (range: [number, number]) => {
      setPriceRange(range)
      updateURLParams({ priceRange: range })
    },
    [updateURLParams]
  )

  const handleInStockChange = useCallback(
    (checked: boolean) => {
      setInStockOnly(checked)
      updateURLParams({ inStock: checked })
    },
    [updateURLParams]
  )

  const handleSortChange = useCallback(
    (value: SortOption) => {
      setSortBy(value)
      updateURLParams({ sort: value })
    },
    [updateURLParams]
  )

  const handleMinRatingChange = useCallback(
    (rating: number) => {
      setMinRating(rating)
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (rating > 0) {
          params.set('minRating', rating.toString())
        } else {
          params.delete('minRating')
        }
        router.push(`/shop?${params.toString()}`)
      })
    },
    [searchParams, router]
  )

  const handleOnSaleChange = useCallback(
    (checked: boolean) => {
      setOnSaleOnly(checked)
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (checked) {
          params.set('onSale', 'true')
        } else {
          params.delete('onSale')
        }
        router.push(`/shop?${params.toString()}`)
      })
    },
    [searchParams, router]
  )

  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setCurrentPage(1)
      updateURLParams({ search: searchQuery })
    },
    [searchQuery, updateURLParams]
  )

  const handleClearFilters = useCallback(() => {
    setSelectedCategories([])
    setPriceRange([0, maxPrice])
    setInStockOnly(false)
    setMinRating(0)
    setOnSaleOnly(false)
    setSortBy('newest')
    setSearchQuery('')
    setCurrentPage(1)
    startTransition(() => {
      router.push('/shop')
    })
  }, [router, maxPrice])

  const filterSidebarContent = (
    <FilterSidebar
      categories={categories}
      selectedCategories={selectedCategories}
      onCategoryChange={handleCategoryChange}
      priceRange={currentPriceRange}
      onPriceRangeChange={handlePriceRangeChange}
      inStockOnly={inStockOnly}
      onInStockChange={handleInStockChange}
      minRating={minRating}
      onMinRatingChange={handleMinRatingChange}
      onSaleOnly={onSaleOnly}
      onOnSaleChange={handleOnSaleChange}
      onClearFilters={handleClearFilters}
      productCount={filteredAndSortedProducts.length}
      maxPrice={maxPrice}
    />
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40">
      {/* Trust Badges Banner */}
      <TrustBadgesBanner />

      <div className="container px-4 mx-auto py-4 md:py-8 max-w-7xl">
        {/* Breadcrumbs - Improved Alignment */}
        <div className="mb-4 md:mb-6">
          <Breadcrumb>
            <BreadcrumbList className="items-center">
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/"
                  className="flex items-center gap-1 text-gray-600 hover:text-orange-600 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="mx-1.5" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-900 font-medium">
                  Shop
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Featured Products Section */}
        {featuredProducts.length > 0 &&
          !searchQuery &&
          selectedCategories.length === 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-orange-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Featured Products
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

        {/* Social Proof Banner - Builds Trust */}
        {filteredAndSortedProducts.length > 0 && (
          <Card className="mb-6 border border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">
                    50,000+ Happy Customers
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-900">
                    4.8★ Average Rating
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-gray-900">
                    {filteredAndSortedProducts.length}+ Products Available
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop All Products
          </h1>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-lg border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 h-11 shadow-sm"
            />
          </form>

          {/* Mobile Filter Button and Sort */}
          <div className="flex items-center justify-between gap-4 mb-4 lg:hidden">
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {selectedCategories.length > 0 ||
                  inStockOnly ||
                  currentPriceRange[0] > 0 ||
                  currentPriceRange[1] < maxPrice ? (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {[
                        selectedCategories.length,
                        inStockOnly ? 1 : 0,
                        currentPriceRange[0] > 0 ||
                        currentPriceRange[1] < maxPrice
                          ? 1
                          : 0,
                      ].reduce((a, b) => a + b, 0)}
                    </Badge>
                  ) : null}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">{filterSidebarContent}</div>
              </SheetContent>
            </Sheet>

            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Sort and View Toggle */}
          <div className="hidden lg:flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Showing{' '}
              <span className="font-semibold text-gray-900">
                {filteredAndSortedProducts.length > 0
                  ? `${(currentPage - 1) * productsPerPage + 1}-${Math.min(currentPage * productsPerPage, filteredAndSortedProducts.length)}`
                  : 0}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-gray-900">
                {filteredAndSortedProducts.length}
              </span>{' '}
              products
            </p>
            <div className="flex items-center gap-3">
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => {
                  if (value) setViewMode(value as 'grid' | 'list')
                }}
              >
                <ToggleGroupItem value="grid" aria-label="Grid view">
                  <Grid3x3 className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              <span className="text-sm text-gray-600">Sort by:</span>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block flex-shrink-0">
            <div className="sticky top-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              {filterSidebarContent}
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {isPending ? (
              <ProductGridSkeleton count={6} />
            ) : filteredAndSortedProducts.length === 0 ? (
              <EmptyState
                type="products"
                title="No products found"
                description="Try adjusting your filters or search terms to find what you're looking for."
                actionLabel="Clear All Filters"
                onAction={handleClearFilters}
              />
            ) : (
              <>
                <div
                  className={cn(
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6'
                      : 'space-y-4'
                  )}
                >
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              if (currentPage > 1) {
                                setCurrentPage(currentPage - 1)
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }
                            }}
                            className={
                              currentPage === 1
                                ? 'pointer-events-none opacity-50'
                                : ''
                            }
                          />
                        </PaginationItem>

                        {[...Array(totalPages)].map((_, i) => {
                          const page = i + 1
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setCurrentPage(page)
                                    window.scrollTo({
                                      top: 0,
                                      behavior: 'smooth',
                                    })
                                  }}
                                  isActive={currentPage === page}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )
                          }
                          return null
                        })}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              if (currentPage < totalPages) {
                                setCurrentPage(currentPage + 1)
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }
                            }}
                            className={
                              currentPage === totalPages
                                ? 'pointer-events-none opacity-50'
                                : ''
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
