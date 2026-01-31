'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Smooth scroll behavior for mobile
 * Ensures smooth scrolling throughout the app
 */
export function SmoothScroll() {
  const pathname = usePathname()

  useEffect(() => {
    // Enable smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth'

    // Scroll to top on route change (with smooth behavior)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    return () => {
      // Reset on unmount
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [pathname])

  return null
}









