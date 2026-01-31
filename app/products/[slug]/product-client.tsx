'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Check } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'

interface Product {
  id: string
  name: string
  price: number
  image: string
  inStock: boolean
}

interface ProductClientProps {
  product: Product
}

export function ProductClient({ product }: ProductClientProps) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  const handleAddToCart = () => {
    if (!product) return

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image || '📦',
        sku: product.sku,
      })
    }
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  return (
    <>
      {/* Quantity Selector */}
      <div className="flex items-center gap-4 py-4 border-y border-gray-200">
        <span className="font-semibold text-gray-900">Quantity:</span>
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg hover:bg-orange-50 hover:text-orange-600"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-semibold">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg hover:bg-orange-50 hover:text-orange-600"
            onClick={() => setQuantity(quantity + 1)}
            disabled={!product.inStock}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <Button
        size="lg"
        className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleAddToCart}
        disabled={addedToCart || !product.inStock}
      >
        {addedToCart ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Added to Cart
          </>
        ) : !product.inStock ? (
          'Out of Stock'
        ) : (
          'Add to Cart'
        )}
      </Button>
    </>
  )
}
