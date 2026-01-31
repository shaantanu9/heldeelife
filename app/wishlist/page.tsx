'use client'

import { useWishlist } from '@/contexts/wishlist-context'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/mobile/empty-states'
import { useCart } from '@/contexts/cart-context'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const router = useRouter()

  const handleAddToCart = (item: (typeof wishlist)[0]) => {
    addToCart({
      id: item.id,
      product_id: item.product_id,
      name: item.name,
      price: item.price,
      image: item.image,
    })
    toast.success('Added to cart!', {
      description: item.name,
      action: {
        label: 'View Cart',
        onClick: () => router.push('/cart'),
      },
    })
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-24">
        <div className="container px-4">
          <EmptyState type="wishlist" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            My <span className="text-orange-600">Wishlist</span>
          </h1>
          <span className="text-gray-600">
            {wishlist.length} item{wishlist.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <Card
              key={item.product_id}
              className="group relative border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white"
            >
              <Link href={`/products/${item.slug || item.product_id}`}>
                <CardContent className="p-0">
                  <div className="aspect-square bg-orange-50 rounded-t-lg flex items-center justify-center relative overflow-hidden group-hover:bg-orange-100 transition-colors">
                    {item.image && item.image.startsWith('http') ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />
                    ) : (
                      <span className="text-6xl opacity-70">
                        {item.image || '📦'}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-orange-600 font-bold text-xl">
                      Rs. {Number(item.price).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Link>
              <CardFooter className="pt-0 px-4 pb-4 flex gap-2">
                <Button
                  onClick={() => handleAddToCart(item)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeFromWishlist(item.product_id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}









