'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Package, X } from 'lucide-react'
import Image from 'next/image'
import { useDebounce } from '@/hooks/use-debounce'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  short_description?: string
  images?: string[]
  product_categories?: {
    name: string
    slug: string
  }
}

interface ProductSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (product: Product) => void
}

export function ProductSearchDialog({
  open,
  onOpenChange,
  onSelect,
}: ProductSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Fetch products
  const fetchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      // Fetch featured products when no query
      setIsLoading(true)
      try {
        const response = await fetch(`/api/products?featured=true&limit=12`)
        const data = await response.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/products?search=${encodeURIComponent(query)}&limit=20`
      )
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error searching products:', error)
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Search when debounced query changes
  useEffect(() => {
    if (open) {
      fetchProducts(debouncedSearch)
    }
  }, [debouncedSearch, open, fetchProducts])

  // Load featured products when dialog opens
  useEffect(() => {
    if (open && !searchQuery) {
      fetchProducts('')
    }
  }, [open, searchQuery, fetchProducts])

  const handleSelect = (product: Product) => {
    setSelectedProduct(product)
  }

  const handleInsert = () => {
    if (selectedProduct) {
      onSelect(selectedProduct)
      setSelectedProduct(null)
      setSearchQuery('')
      onOpenChange(false)
    }
  }

  const handleClear = () => {
    setSearchQuery('')
    setSelectedProduct(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Search & Insert Product</DialogTitle>
          <DialogDescription>
            Search for products to embed in your blog post. The product will be
            displayed with image, name, price, and a link.
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products by name, description, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Selected Product Preview */}
        {selectedProduct && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {selectedProduct.images && selectedProduct.images[0] && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {selectedProduct.name}
                </p>
                <p className="text-sm text-gray-600">
                  ₹{Number(selectedProduct.price).toFixed(2)}
                </p>
              </div>
            </div>
            <Button onClick={handleInsert} size="sm">
              Insert Product
            </Button>
          </div>
        )}

        {/* Products List */}
        <div className="flex-1 overflow-y-auto mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products found</p>
              {searchQuery && (
                <p className="text-sm mt-2">
                  Try a different search term or browse featured products
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedProduct?.id === product.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex gap-4">
                    {product.images && product.images[0] ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {product.name}
                      </h3>
                      {product.product_categories && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {product.product_categories.name}
                        </Badge>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        ₹{Number(product.price).toFixed(2)}
                      </p>
                      {product.short_description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {product.short_description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}








