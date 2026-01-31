'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { toast } from 'sonner'
import { Scale } from 'lucide-react'

interface ComparisonProduct {
  id: string
  product_id: string
  name: string
  slug: string
  price: number
  compare_at_price?: number
  image: string
  short_description?: string
  description?: string
  inStock: boolean
  stockQuantity?: number
  rating?: number
  reviews_count?: number
  sales_count?: number
  sku?: string
  category?: string
  benefits?: string[]
  ingredients?: string
  usage_instructions?: string
  storage_instructions?: string
  manufacturer?: string
  weight?: number
  dimensions?: any
}

interface ComparisonContextType {
  comparison: ComparisonProduct[]
  addToComparison: (product: ComparisonProduct) => void
  removeFromComparison: (productId: string) => void
  isInComparison: (productId: string) => boolean
  clearComparison: () => void
  totalItems: number
  canAddMore: boolean
  maxItems: number
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(
  undefined
)

const MAX_COMPARISON_ITEMS = 4

export function ComparisonProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [comparison, setComparison] = useState<ComparisonProduct[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const lastToastRef = useRef<{ productId: string; timestamp: number } | null>(
    null
  )

  // Load comparison from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('heldeelife-comparison')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setComparison(parsed.slice(0, MAX_COMPARISON_ITEMS))
        }
      }
    } catch (error) {
      console.error('Error loading comparison:', error)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // Save to localStorage whenever comparison changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(
          'heldeelife-comparison',
          JSON.stringify(comparison)
        )
      } catch (error) {
        console.error('Error saving comparison:', error)
      }
    }
  }, [comparison, isHydrated])

  const addToComparison = useCallback((product: ComparisonProduct) => {
    setComparison((prev) => {
      // Check if already in comparison
      if (prev.some((p) => p.id === product.id)) {
        // Prevent duplicate toast for "already in comparison"
        const now = Date.now()
        if (
          !lastToastRef.current ||
          lastToastRef.current.productId !== product.id ||
          now - lastToastRef.current.timestamp > 1000
        ) {
          toast.info(`${product.name} is already in comparison`)
          lastToastRef.current = { productId: product.id, timestamp: now }
        }
        return prev
      }

      // Check if max items reached
      if (prev.length >= MAX_COMPARISON_ITEMS) {
        // Prevent duplicate toast for max items
        const now = Date.now()
        if (
          !lastToastRef.current ||
          lastToastRef.current.productId !== 'max_items' ||
          now - lastToastRef.current.timestamp > 1000
        ) {
          toast.error(
            `You can compare up to ${MAX_COMPARISON_ITEMS} products. Remove one to add another.`,
            {
              action: {
                label: 'View Comparison',
                onClick: () => {
                  window.location.href = '/compare'
                },
              },
            }
          )
          lastToastRef.current = { productId: 'max_items', timestamp: now }
        }
        return prev
      }

      // Prevent duplicate toast for successful add (React Strict Mode double render)
      const now = Date.now()
      if (
        !lastToastRef.current ||
        lastToastRef.current.productId !== product.id ||
        now - lastToastRef.current.timestamp > 500
      ) {
        toast.success(`${product.name} added to comparison`, {
          action: {
            label: 'Compare Now',
            onClick: () => {
              window.location.href = '/compare'
            },
          },
        })
        lastToastRef.current = { productId: product.id, timestamp: now }
      }

      return [...prev, product]
    })
  }, [])

  const removeFromComparison = useCallback((productId: string) => {
    setComparison((prev) => {
      const product = prev.find((p) => p.id === productId)
      const updated = prev.filter((p) => p.id !== productId)
      if (product) {
        toast.success(`${product.name} removed from comparison`)
      }
      return updated
    })
  }, [])

  const isInComparison = useCallback(
    (productId: string) => {
      return comparison.some((p) => p.id === productId)
    },
    [comparison]
  )

  const clearComparison = useCallback(() => {
    setComparison([])
    toast.success('Comparison cleared')
  }, [])

  const value: ComparisonContextType = {
    comparison,
    addToComparison,
    removeFromComparison,
    isInComparison,
    clearComparison,
    totalItems: comparison.length,
    canAddMore: comparison.length < MAX_COMPARISON_ITEMS,
    maxItems: MAX_COMPARISON_ITEMS,
  }

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  )
}

export function useComparison() {
  const context = useContext(ComparisonContext)
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider')
  }
  return context
}

