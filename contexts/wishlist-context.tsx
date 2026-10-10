'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react'
import { useSession } from 'next-auth/react'
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

const STORAGE_KEY = 'heldeelife-wishlist'

interface ServerWishlistRow {
  id: string
  product_id: string
  products?: {
    id: string
    name: string
    slug?: string | null
    price: number
    image?: string | null
  } | null
}

function rowToItem(row: ServerWishlistRow): WishlistItem {
  return {
    id: row.product_id,
    product_id: row.product_id,
    name: row.products?.name || 'Product',
    price: Number(row.products?.price ?? 0),
    image: row.products?.image || '📦',
    slug: row.products?.slug || undefined,
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const { data: session, status } = useSession()
  const userId = status === 'authenticated' ? session?.user?.id : undefined

  // Latest wishlist, for callbacks that must not run side effects inside
  // state updaters.
  const wishlistRef = useRef<WishlistItem[]>([])
  wishlistRef.current = wishlist
  // product_id -> wishlist row id on the server (needed for DELETE)
  const serverIdsRef = useRef<Map<string, string>>(new Map())
  const syncedUserRef = useRef<string | null>(null)

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setWishlist(parsed)
        }
      }
    } catch (error) {
      console.error('Error loading wishlist:', error)
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist))
      } catch (error) {
        console.error('Error saving wishlist:', error)
      }
    }
  }, [wishlist, isHydrated])

  const fetchServerWishlist = useCallback(async (): Promise<
    ServerWishlistRow[] | null
  > => {
    try {
      const response = await fetch('/api/wishlist', { cache: 'no-store' })
      if (!response.ok) return null
      const data = await response.json()
      const rows: ServerWishlistRow[] = Array.isArray(data.wishlist)
        ? data.wishlist
        : []
      serverIdsRef.current = new Map(rows.map((r) => [r.product_id, r.id]))
      return rows
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      return null
    }
  }, [])

  const addOnServer = useCallback(async (productId: string) => {
    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.wishlistItem?.id) {
          serverIdsRef.current.set(productId, data.wishlistItem.id)
        }
      }
      // 400 "already in wishlist" is fine: the server already has it
    } catch (error) {
      console.error('Error syncing wishlist add:', error)
    }
  }, [])

  const removeOnServer = useCallback(
    async (productId: string) => {
      try {
        let rowId = serverIdsRef.current.get(productId)
        if (!rowId) {
          await fetchServerWishlist()
          rowId = serverIdsRef.current.get(productId)
        }
        if (!rowId) return
        const response = await fetch(`/api/wishlist/${rowId}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          serverIdsRef.current.delete(productId)
        }
      } catch (error) {
        console.error('Error syncing wishlist removal:', error)
      }
    },
    [fetchServerWishlist]
  )

  // On sign-in: merge local (guest) items into the server wishlist, then use
  // the server list as the source of truth.
  useEffect(() => {
    if (!isHydrated) return
    if (!userId) {
      syncedUserRef.current = null
      serverIdsRef.current = new Map()
      return
    }
    if (syncedUserRef.current === userId) return
    syncedUserRef.current = userId

    let cancelled = false
    ;(async () => {
      const rows = await fetchServerWishlist()
      if (cancelled || rows === null) return

      const onServer = new Set(rows.map((r) => r.product_id))
      const localOnly = wishlistRef.current.filter(
        (item) => !onServer.has(item.product_id)
      )
      await Promise.all(localOnly.map((item) => addOnServer(item.product_id)))
      if (cancelled) return

      const merged = [...rows.map(rowToItem), ...localOnly]
      setWishlist(merged)
    })()

    return () => {
      cancelled = true
    }
  }, [isHydrated, userId, fetchServerWishlist, addOnServer])

  const addToWishlist = useCallback(
    (item: WishlistItem) => {
      if (wishlistRef.current.some((i) => i.product_id === item.product_id)) {
        return
      }

      setWishlist((prev) =>
        prev.some((i) => i.product_id === item.product_id)
          ? prev
          : [...prev, item]
      )

      if (typeof window !== 'undefined') {
        AnalyticsTracker.trackWishlistAction('add', item.product_id, item.name)
      }
      toast.success('Added to wishlist', {
        description: item.name,
        icon: <Heart className="h-4 w-4 fill-red-500 text-red-500" />,
      })

      if (userId) {
        void addOnServer(item.product_id)
      }
    },
    [userId, addOnServer]
  )

  const removeFromWishlist = useCallback(
    (productId: string) => {
      const item = wishlistRef.current.find((i) => i.product_id === productId)

      setWishlist((prev) => prev.filter((i) => i.product_id !== productId))

      if (item) {
        if (typeof window !== 'undefined') {
          AnalyticsTracker.trackWishlistAction('remove', productId, item.name)
        }
        toast.info('Removed from wishlist', {
          description: item.name,
        })
      }

      if (userId) {
        void removeOnServer(productId)
      }
    },
    [userId, removeOnServer]
  )

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
