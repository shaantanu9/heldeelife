'use client'

import { useEffect } from 'react'

/**
 * Mobile-specific optimizations that run on client-side
 * This component applies various mobile enhancements
 */
export default function MobileOptimizations() {
  useEffect(() => {
    // Prevent zoom on double tap (iOS)
    let lastTouchEnd = 0
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        e.preventDefault()
      }
      lastTouchEnd = now
    }

    document.addEventListener('touchend', preventDoubleTapZoom, {
      passive: false,
    })

    // Improve scroll performance
    if (CSS.supports('scroll-behavior', 'smooth')) {
      document.documentElement.style.scrollBehavior = 'smooth'
    }

    // Add viewport height fix for mobile browsers
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    setViewportHeight()
    window.addEventListener('resize', setViewportHeight)
    window.addEventListener('orientationchange', setViewportHeight)

    // Prevent pull-to-refresh on main content (keep it for specific areas)
    let touchStartY = 0
    const preventPullToRefresh = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop

      // Only prevent if at top and scrolling down
      if (scrollTop === 0 && touchY > touchStartY) {
        // Allow pull-to-refresh in specific areas (handled by PullToRefresh component)
        const target = e.target as HTMLElement
        if (!target.closest('[data-allow-pull-refresh]')) {
          e.preventDefault()
        }
      }
    }

    document.addEventListener('touchstart', preventPullToRefresh, {
      passive: true,
    })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      document.removeEventListener('touchend', preventDoubleTapZoom)
      document.removeEventListener('touchstart', preventPullToRefresh)
      document.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('resize', setViewportHeight)
      window.removeEventListener('orientationchange', setViewportHeight)
    }
  }, [])

  return null
}
