'use client'

import { useEffect } from 'react'
import { performanceMonitor } from '@/lib/utils/performance-monitor'

/**
 * Performance Monitor Component
 * Tracks and logs performance metrics in production
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.measurePageLoad()
    performanceMonitor.getWebVitals()

    // Log metrics periodically in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const metrics = performanceMonitor.getMetrics()
        if (metrics.length > 0) {
          console.log('Performance Metrics:', metrics)
        }
      }, 30000) // Every 30 seconds

      return () => clearInterval(interval)
    }
  }, [])

  // This component doesn't render anything
  return null
}
