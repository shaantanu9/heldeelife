/**
 * Media Query Hook
 * Returns whether a media query matches
 */

import { useState, useEffect } from 'react'
import { BREAKPOINTS } from '@/lib/constants'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia(query)

    // Set initial value
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    // Create listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    } else {
      // Fallback for older browsers
      media.addListener(listener)
      return () => media.removeListener(listener)
    }
  }, [matches, query])

  return matches
}

// Convenience hooks for common breakpoints
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`)
}

export function useIsTablet() {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`
  )
}

export function useIsDesktop() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`)
}

export function useIsSmallScreen() {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.sm - 1}px)`)
}









