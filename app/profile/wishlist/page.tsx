'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Heart,
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Package,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { useCart } from '@/contexts/cart-context'
import React from 'react'

interface WishlistItem {
  id: string
  product_id: string
  created_at: string
  products: {
    id: string
    name: string
    slug: string
    price: number
    image: string
    is_active: boolean
  }
}

export default function WishlistPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { addToCart } = useCart()
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchWishlist()
  }, [session, router])

  const fetchWishlist = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/wishlist')
      if (response.ok) {
        const data = await response.json()
        setWishlist(data.wishlist || [])
      } else {
        toast.error('Failed to load wishlist')
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      toast.error('Failed to load wishlist')
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromWishlist = async (
    wishlistId: string,
    productName: string
  ) => {
    try {
      setRemovingIds((prev) => new Set(prev).add(wishlistId))
      const response = await fetch(`/api/wishlist/${wishlistId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setWishlist((prev) => prev.filter((item) => item.id !== wishlistId))
        toast.success('Removed from wishlist', {
          description: productName,
        })
      } else {
        toast.error('Failed to remove from wishlist')
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      toast.error('Failed to remove from wishlist')
    } finally {
      setRemovingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(wishlistId)
        return newSet
      })
    }
  }

  const handleAddToCart = (product: WishlistItem['products']) => {
    if (!product.is_active) {
      toast.error('Product is not available')
      return
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || '',
      slug: product.slug,
    })

    toast.success('Added to cart', {
      description: product.name,
    })
  }

  if (!session) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-24">
        <div className="container px-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              My Wishlist
            </h1>
            <p className="text-gray-600">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
        </div>

        {wishlist.length === 0 ? (
          <Card className="border border-gray-200 shadow-xl bg-white">
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-gray-600 mb-6">
                Start adding products you love to your wishlist
              </p>
              <Button
                asChild
                className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Link href="/shop">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => {
              const product = item.products
              const isRemoving = removingIds.has(item.id)
              return (
                <WishlistItemCard
                  key={item.id}
                  item={item}
                  isRemoving={isRemoving}
                  onRemove={removeFromWishlist}
                  onAddToCart={handleAddToCart}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function WishlistItemCard({
  item,
  isRemoving,
  onRemove,
  onAddToCart,
}: {
  item: WishlistItem
  isRemoving: boolean
  onRemove: (id: string, name: string) => void
  onAddToCart: (product: WishlistItem['products']) => void
}) {
  const product = item.products
  const [imageError, setImageError] = useState(false)

  return (
    <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
      <div className="relative">
        <Link href={`/products/${product.slug}`}>
          <div className="relative w-full h-48 bg-gray-100 rounded-t-lg overflow-hidden">
            {product.image && !imageError ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        </Link>
        {!product.is_active && (
          <Badge className="absolute top-2 right-2 bg-red-500">
            Unavailable
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-orange-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-lg font-bold text-orange-600 mb-4">
          Rs. {Number(product.price).toFixed(2)}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white"
            onClick={() => onAddToCart(product)}
            disabled={!product.is_active || isRemoving}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={() => onRemove(item.id, product.name)}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
