'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { AnalyticsTracker } from '@/lib/analytics/tracking'

/**
 * Analytics Initializer Component
 * Initializes analytics tracking on app load
 */
export function AnalyticsInitializer() {
  const { data: session } = useSession()

  useEffect(() => {
    // Initialize analytics with user ID if available
    AnalyticsTracker.init(session?.user?.id)

    // Track page view on mount
    AnalyticsTracker.trackPageView()

    // Track page views on route changes
    const handleRouteChange = () => {
      AnalyticsTracker.trackPageView()
    }

    // Listen for route changes (Next.js App Router)
    window.addEventListener('popstate', handleRouteChange)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [session?.user?.id])

  return null
}









