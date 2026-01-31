'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, X } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'

interface RecentlyViewedProduct {
  id: string
  product_id: string
  name: string
  price: number
  image: string
  slug?: string
}

export function RecentlyViewed() {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([])
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    // Load recently viewed from localStorage
    const saved = localStorage.getItem('heldeelife-recently-viewed')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setProducts(parsed.slice(0, 6)) // Show max 6 products
        }
      } catch {
        setProducts([])
      }
    }
  }, [])

  const clearHistory = () => {
    setProducts([])
    localStorage.removeItem('heldeelife-recently-viewed')
  }

  if (products.length === 0) return null

  return (
    <section className="py-8 bg-white">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Recently Viewed
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="text-gray-600 hover:text-gray-900"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="group border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all"
            >
              <Link href={`/products/${product.slug || product.id}`}>
                <CardContent className="p-3">
                  <div className="aspect-square bg-orange-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-orange-100 transition-colors relative">
                    {product.image && product.image.startsWith('http') ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain rounded-lg"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                      />
                    ) : (
                      <span className="text-4xl opacity-70">
                        {product.image || '📦'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1 text-gray-900 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-orange-600 font-bold text-base">
                    Rs. {Number(product.price).toFixed(2)}
                  </p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// Hook to track product views
export function useTrackProductView() {
  const trackView = (product: RecentlyViewedProduct) => {
    const saved = localStorage.getItem('heldeelife-recently-viewed')
    let products: RecentlyViewedProduct[] = []

    if (saved) {
      try {
        products = JSON.parse(saved)
      } catch {
        products = []
      }
    }

    // Remove if already exists
    products = products.filter((p) => p.product_id !== product.product_id)
    // Add to beginning
    products.unshift(product)
    // Keep only last 20
    products = products.slice(0, 20)

    localStorage.setItem('heldeelife-recently-viewed', JSON.stringify(products))
  }

  return { trackView }
}









