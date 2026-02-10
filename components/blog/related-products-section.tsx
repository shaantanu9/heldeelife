'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, ArrowRight } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  images?: string[]
  short_description?: string
  product_categories?: {
    name: string
    slug: string
  }
  inStock?: boolean
}

interface RelatedProductsSectionProps {
  products: Product[]
  title?: string
  description?: string
}

export function RelatedProductsSection({
  products,
  title = 'Related Products',
  description = 'Products mentioned in this article',
}: RelatedProductsSectionProps) {
  const { addToCart } = useCart()

  if (products.length === 0) return null

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      product_id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
    })
  }

  return (
    <section className="mt-12 sm:mt-16 pt-12 sm:pt-16 border-t border-gray-200">
      <div className="max-w-680 mx-auto">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">
            {title}
          </h2>
          {description && <p className="text-gray-600">{description}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className="group border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <Link href={`/products/${product.slug}`} className="block">
                {product.images && product.images[0] ? (
                  <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <ShoppingCart className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </Link>
              <CardContent className="p-4 sm:p-6">
                {product.product_categories && (
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {product.product_categories.name}
                  </Badge>
                )}
                <Link href={`/products/${product.slug}`}>
                  <h3 className="font-semibold text-base sm:text-lg mb-2 group-hover:text-orange-600 transition-colors line-clamp-2 text-gray-900">
                    {product.name}
                  </h3>
                </Link>
                {product.short_description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {product.short_description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-orange-600">
                    ₹{Number(product.price).toFixed(2)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Link href={`/products/${product.slug}`}>
                        View
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault()
                        handleAddToCart(product)
                      }}
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}








