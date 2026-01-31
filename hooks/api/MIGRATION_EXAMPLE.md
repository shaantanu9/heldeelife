# Migration Example: Shop Page

This document shows how to migrate from direct `fetch` calls to React Query hooks.

## Before (using fetch)

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

function ShopPageContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        const response = await fetch('/api/products')
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        const data = await response.json()
        setProducts(data.products || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // ... rest of component
}
```

## After (using React Query hooks)

```typescript
'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useProducts, useProductCategories } from '@/hooks/api'

function ShopPageContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'All'
  )

  // Build filters
  const productFilters = useMemo(() => {
    const filters: { category?: string; search?: string } = {}
    if (selectedCategory !== 'All') {
      filters.category = selectedCategory
    }
    if (searchQuery) {
      filters.search = searchQuery
    }
    return Object.keys(filters).length > 0 ? filters : undefined
  }, [selectedCategory, searchQuery])

  // Use hooks - automatic caching, loading, and error handling
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
  } = useProducts(productFilters)

  const { data: categories = [], isLoading: categoriesLoading } =
    useProductCategories()

  const loading = productsLoading || categoriesLoading
  const error = productsError
    ? productsError instanceof Error
      ? productsError.message
      : 'Failed to load products'
    : null

  // Products are already filtered by the API
  // No need for additional client-side filtering unless needed
  const filteredProducts = products

  // ... rest of component (same JSX)
}
```

## Key Benefits

1. **Automatic Caching**: Data is cached and shared across components
2. **Request Deduplication**: Multiple components requesting the same data share one request
3. **Automatic Refetching**: Data refetches on window focus (production only)
4. **Less Boilerplate**: No need for useState, useEffect, try/catch for each API call
5. **Better Error Handling**: Errors are properly typed and handled
6. **Optimistic Updates**: Mutations can update UI immediately

## Migration Steps

1. Replace `useState` for data with React Query hooks
2. Remove manual `useEffect` fetch calls
3. Use `isLoading` from hooks instead of manual loading state
4. Use `error` from hooks instead of manual error state
5. Remove try/catch blocks (handled by React Query)
6. Update filters to use query parameters in hooks









