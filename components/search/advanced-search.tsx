'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, Clock, TrendingUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface SearchSuggestion {
  id: string
  text: string
  type: 'product' | 'symptom' | 'category' | 'recent' | 'popular'
  url?: string
}

interface AdvancedSearchProps {
  onClose?: () => void
  autoFocus?: boolean
}

// Ayurvedic symptoms/benefits for smart search
const AYURVEDIC_SYMPTOMS = [
  'Cold & Cough',
  'Digestion',
  'Immunity',
  'Stress Relief',
  'Skin Care',
  'Hair Care',
  'Joint Pain',
  'Sleep',
  'Energy',
  'Weight Management',
  'Detox',
  'Respiratory',
]

export function AdvancedSearch({
  onClose,
  autoFocus = false,
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('heldeelife-recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch {
        setRecentSearches([])
      }
    }

    // Load popular searches (could be from API)
    setPopularSearches([
      'Tulsi',
      'Turmeric',
      'Ashwagandha',
      'Cold Relief',
      'Immunity Booster',
    ])
  }, [])

  // Fetch search suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      // Search products
      const response = await fetch(
        `/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`
      )
      const data = await response.json()

      const productSuggestions: SearchSuggestion[] =
        data.products?.slice(0, 5).map((product: any) => ({
          id: product.id,
          text: product.name,
          type: 'product' as const,
          url: `/products/${product.slug || product.id}`,
        })) || []

      // Match Ayurvedic symptoms
      const symptomMatches = AYURVEDIC_SYMPTOMS.filter((symptom) =>
        symptom.toLowerCase().includes(searchQuery.toLowerCase())
      )
      const symptomSuggestions: SearchSuggestion[] = symptomMatches.map(
        (symptom) => ({
          id: `symptom-${symptom}`,
          text: symptom,
          type: 'symptom' as const,
          url: `/shop?search=${encodeURIComponent(symptom)}`,
        })
      )

      setSuggestions([...symptomSuggestions, ...productSuggestions])
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        fetchSuggestions(query)
        setShowSuggestions(true)
      } else {
        setSuggestions([])
        setShowSuggestions(true)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, fetchSuggestions])

  // Handle search
  const handleSearch = (searchQuery: string, url?: string) => {
    if (!searchQuery.trim()) return

    // Save to recent searches
    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('heldeelife-recent-searches', JSON.stringify(updated))

    // Navigate
    if (url) {
      router.push(url)
    } else {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }

    setQuery('')
    setShowSuggestions(false)
    onClose?.()
  }

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query) {
      handleSearch(query)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      onClose?.()
    }
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus input
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search products, symptoms, or benefits..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          className="pl-10 pr-10 h-12 text-base rounded-lg border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setShowSuggestions(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          )}

          {!isLoading && query && suggestions.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No results found. Try different keywords.
            </div>
          )}

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 px-3 py-2">
                Suggestions
              </div>
              {suggestions.map((suggestion) => (
                <Link
                  key={suggestion.id}
                  href={
                    suggestion.url ||
                    `/search?q=${encodeURIComponent(suggestion.text)}`
                  }
                  onClick={() => handleSearch(suggestion.text, suggestion.url)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-orange-50 rounded-md transition-colors group"
                >
                  {suggestion.type === 'symptom' ? (
                    <Sparkles className="h-4 w-4 text-orange-600" />
                  ) : (
                    <Search className="h-4 w-4 text-gray-400 group-hover:text-orange-600" />
                  )}
                  <span className="flex-1 text-sm text-gray-700 group-hover:text-orange-600">
                    {suggestion.text}
                  </span>
                  {suggestion.type === 'symptom' && (
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      Symptom
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-500 px-3 py-2 flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Recent Searches
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(search)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-orange-50 rounded-md transition-colors text-left"
                >
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="flex-1 text-sm text-gray-700">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular Searches */}
          {!query && popularSearches.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-500 px-3 py-2 flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                Popular Searches
              </div>
              <div className="flex flex-wrap gap-2 px-3 py-2">
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="text-xs px-3 py-1 bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-600 rounded-full transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Symptom Search */}
          {!query && (
            <div className="p-2 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-500 px-3 py-2 flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Search by Health Concern
              </div>
              <div className="flex flex-wrap gap-2 px-3 py-2">
                {AYURVEDIC_SYMPTOMS.slice(0, 6).map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() =>
                      handleSearch(
                        symptom,
                        `/shop?search=${encodeURIComponent(symptom)}`
                      )
                    }
                    className="text-xs px-3 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 hover:text-orange-600 rounded-full transition-colors border border-orange-200"
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}









