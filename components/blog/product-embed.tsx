'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, ShoppingCart, ArrowRight } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'

interface ProductEmbedProps {
  productId: string
  productName: string
  productSlug: string
  productPrice: number
  productImage?: string
  productDescription?: string
  productCategory?: string
  className?: string
}

export function ProductEmbed({
  productId,
  productName,
  productSlug,
  productPrice,
  productImage,
  productDescription,
  productCategory,
  className = '',
}: ProductEmbedProps) {
  const { addToCart } = useCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart({
      id: productId,
      product_id: productId,
      name: productName,
      price: productPrice,
      image: productImage || '',
    })
  }

  return (
    <Card
      className={`border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-lg transition-all duration-300 ${className}`}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Product Image */}
          <Link
            href={`/products/${productSlug}`}
            className="block flex-shrink-0"
          >
            {productImage ? (
              <div className="relative w-full md:w-48 h-48 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={productImage}
                  alt={productName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 200px"
                />
              </div>
            ) : (
              <div className="w-full md:w-48 h-48 rounded-lg bg-gray-100 flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </Link>

          {/* Product Info */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              {productCategory && (
                <Badge variant="secondary" className="mb-2">
                  {productCategory}
                </Badge>
              )}
              <Link href={`/products/${productSlug}`}>
                <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-orange-600 transition-colors">
                  {productName}
                </h3>
              </Link>
              {productDescription && (
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {productDescription}
                </p>
              )}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-2xl font-bold text-orange-600">
                  ₹{Number(productPrice).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                asChild
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Link href={`/products/${productSlug}`}>
                  View Product
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={handleAddToCart}
                className="border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}








