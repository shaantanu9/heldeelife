'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'

export interface ShoppingFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  sortBy?:
    | 'price_asc'
    | 'price_desc'
    | 'name_asc'
    | 'name_desc'
    | 'newest'
    | 'popular'
  inStock?: boolean
  searchQuery?: string
}

interface ShoppingContextType {
  // Filters
  filters: ShoppingFilters
  setFilters: (
    filters: ShoppingFilters | ((prev: ShoppingFilters) => ShoppingFilters)
  ) => void
  resetFilters: () => void

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
  clearSearch: () => void

  // View preferences
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void

  // Pagination
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void

  // Recently viewed products
  recentlyViewed: string[]
  addToRecentlyViewed: (productId: string) => void
  clearRecentlyViewed: () => void
}

const defaultFilters: ShoppingFilters = {
  sortBy: 'newest',
}

const ShoppingContext = createContext<ShoppingContextType | undefined>(
  undefined
)

export function ShoppingProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<ShoppingFilters>(defaultFilters)
  const [searchQuery, setSearchQueryState] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([])

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const savedViewMode = localStorage.getItem(
        'heldeelife-shopping-view-mode'
      )
      if (savedViewMode === 'grid' || savedViewMode === 'list') {
        setViewMode(savedViewMode)
      }

      const savedPageSize = localStorage.getItem(
        'heldeelife-shopping-page-size'
      )
      if (savedPageSize) {
        const size = parseInt(savedPageSize, 10)
        if (size > 0) {
          setPageSize(size)
        }
      }

      const savedRecentlyViewed = localStorage.getItem(
        'heldeelife-recently-viewed'
      )
      if (savedRecentlyViewed) {
        try {
          const parsed = JSON.parse(savedRecentlyViewed)
          if (Array.isArray(parsed)) {
            setRecentlyViewed(parsed)
          }
        } catch {
          // Invalid JSON, ignore
        }
      }
    } catch (error) {
      console.error('Error loading shopping preferences:', error)
    }
  }, [])

  // Save view mode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('heldeelife-shopping-view-mode', viewMode)
    } catch (error) {
      console.error('Error saving view mode:', error)
    }
  }, [viewMode])

  // Save page size to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('heldeelife-shopping-page-size', pageSize.toString())
    } catch (error) {
      console.error('Error saving page size:', error)
    }
  }, [pageSize])

  // Save recently viewed to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        'heldeelife-recently-viewed',
        JSON.stringify(recentlyViewed)
      )
    } catch (error) {
      console.error('Error saving recently viewed:', error)
    }
  }, [recentlyViewed])

  const setFilters = useCallback(
    (
      newFilters: ShoppingFilters | ((prev: ShoppingFilters) => ShoppingFilters)
    ) => {
      setFiltersState((prev) => {
        const updated =
          typeof newFilters === 'function' ? newFilters(prev) : newFilters
        // Reset page when filters change
        setPage(1)
        return updated
      })
    },
    []
  )

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters)
    setPage(1)
  }, [])

  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query)
      setFilters((prev) => ({ ...prev, searchQuery: query || undefined }))
      setPage(1)
    },
    [setFilters]
  )

  const clearSearch = useCallback(() => {
    setSearchQueryState('')
    setFilters((prev) => {
      const { searchQuery, ...rest } = prev
      return rest
    })
    setPage(1)
  }, [setFilters])

  const addToRecentlyViewed = useCallback((productId: string) => {
    setRecentlyViewed((prev) => {
      // Remove if already exists and add to beginning
      const filtered = prev.filter((id) => id !== productId)
      // Keep only last 20 items
      return [productId, ...filtered].slice(0, 20)
    })
  }, [])

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([])
  }, [])

  return (
    <ShoppingContext.Provider
      value={{
        filters,
        setFilters,
        resetFilters,

        searchQuery,
        setSearchQuery,
        clearSearch,

        viewMode,
        setViewMode,

        page,
        setPage,
        pageSize,
        setPageSize,

        recentlyViewed,
        addToRecentlyViewed,
        clearRecentlyViewed,
      }}
    >
      {children}
    </ShoppingContext.Provider>
  )
}

export function useShopping() {
  const context = useContext(ShoppingContext)
  if (context === undefined) {
    throw new Error('useShopping must be used within a ShoppingProvider')
  }
  return context
}









