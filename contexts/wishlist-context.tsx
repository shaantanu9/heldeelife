'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import { toast } from 'sonner'
import { Heart } from 'lucide-react'
import { AnalyticsTracker } from '@/lib/analytics/tracking'

interface WishlistItem {
  id: string
  product_id: string
  name: string
  price: number
  image: string
  slug?: string
}

interface WishlistContextType {
  wishlist: WishlistItem[]
  addToWishlist: (item: WishlistItem) => void
  removeFromWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  toggleWishlist: (item: WishlistItem) => void
  clearWishlist: () => void
  totalItems: number
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('heldeelife-wishlist')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setWishlist(parsed)
        }
      }
    } catch (error) {
      console.error('Error loading wishlist:', error)
      localStorage.removeItem('heldeelife-wishlist')
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('heldeelife-wishlist', JSON.stringify(wishlist))
      } catch (error) {
        console.error('Error saving wishlist:', error)
      }
    }
  }, [wishlist, isHydrated])

  const addToWishlist = useCallback((item: WishlistItem) => {
    setWishlist((prev) => {
      if (prev.find((i) => i.product_id === item.product_id)) {
        return prev
      }
      
      // Track analytics
      if (typeof window !== 'undefined') {
        AnalyticsTracker.trackWishlistAction('add', item.product_id, item.name)
      }
      
      toast.success('Added to wishlist', {
        description: item.name,
        icon: <Heart className="h-4 w-4 fill-red-500 text-red-500" />,
      })
      return [...prev, item]
    })
  }, [])

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist((prev) => {
      const item = prev.find((i) => i.product_id === productId)
      if (item) {
        // Track analytics
        if (typeof window !== 'undefined') {
          AnalyticsTracker.trackWishlistAction('remove', productId, item.name)
        }
        
        toast.info('Removed from wishlist', {
          description: item.name,
        })
      }
      return prev.filter((i) => i.product_id !== productId)
    })
  }, [])

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlist.some((item) => item.product_id === productId)
    },
    [wishlist]
  )

  const toggleWishlist = useCallback(
    (item: WishlistItem) => {
      if (wishlist.some((i) => i.product_id === item.product_id)) {
        removeFromWishlist(item.product_id)
      } else {
        addToWishlist(item)
      }
    },
    [wishlist, addToWishlist, removeFromWishlist]
  )

  const clearWishlist = useCallback(() => {
    setWishlist([])
  }, [])

  const totalItems = useMemo(() => wishlist.length, [wishlist])

  const value = useMemo(
    () => ({
      wishlist,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      toggleWishlist,
      clearWishlist,
      totalItems,
    }),
    [
      wishlist,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      toggleWishlist,
      clearWishlist,
      totalItems,
    ]
  )

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
