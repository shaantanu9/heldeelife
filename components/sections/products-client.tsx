'use client'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { useCart } from '@/contexts/cart-context'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
  image: string
  inStock: boolean
}

interface ProductsClientProps {
  products: Product[]
}

export function ProductsClient({ products }: ProductsClientProps) {
  const { addToCart } = useCart()

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    })
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="py-24 bg-white">
      <div className="container px-4">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-16 tracking-tight">
          Recommended <span className="text-orange-600">Products</span>
        </h2>

        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full max-w-7xl mx-auto"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {products.map((product) => (
              <CarouselItem
                key={product.id}
                className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
              >
                <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white group">
                  <Link href={`/products/${product.slug || product.id}`}>
                    <CardContent className="p-8">
                      <div className="aspect-square bg-orange-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-orange-100 transition-colors">
                        <span className="text-6xl opacity-70">
                          {product.image || '📦'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-orange-600 font-bold text-xl">
                        From Rs. {Number(product.price).toFixed(2)}
                      </p>
                    </CardContent>
                  </Link>
                  <CardFooter className="pt-0 px-8 pb-8">
                    <Button
                      className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                      onClick={(e) => {
                        e.preventDefault()
                        handleAddToCart(product)
                      }}
                      disabled={!product.inStock}
                    >
                      {product.inStock ? 'Add to cart' : 'Out of Stock'}
                    </Button>
                  </CardFooter>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="border-gray-300 hover:border-orange-500 text-gray-600 hover:text-orange-600" />
          <CarouselNext className="border-gray-300 hover:border-orange-500 text-gray-600 hover:text-orange-600" />
        </Carousel>
      </div>
    </section>
  )
}
