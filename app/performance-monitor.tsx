'use client'

import { useEffect } from 'react'
import { reportWebVitals } from '@/lib/utils/performance'

// Type definitions for Performance API
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number
  startTime: number
  entryType: string
}

/**
 * Performance Monitor Component
 * Tracks and reports Web Vitals for performance monitoring
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // LCP - Largest Contentful Paint
    let lcpObserver: PerformanceObserver | null = null
    try {
      lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            reportWebVitals({
              id: entry.entryType,
              name: 'LCP',
              value: entry.startTime,
              label: entry.entryType,
            })
          }
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      // Performance Observer not supported
    }

    // FID - First Input Delay
    let fidObserver: PerformanceObserver | null = null
    try {
      fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            const fidEntry = entry as PerformanceEventTiming
            reportWebVitals({
              id: fidEntry.entryType,
              name: 'FID',
              value: fidEntry.processingStart - fidEntry.startTime,
              label: fidEntry.entryType,
            })
          }
        }
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
    } catch (e) {
      // Performance Observer not supported
    }

    // CLS - Cumulative Layout Shift
    let clsValue = 0
    let clsObserver: PerformanceObserver | null = null
    try {
      clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        reportWebVitals({
          id: 'cls',
          name: 'CLS',
          value: clsValue,
          label: 'layout-shift',
        })
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    } catch (e) {
      // Performance Observer not supported
    }

    // Cleanup
    return () => {
      lcpObserver?.disconnect()
      fidObserver?.disconnect()
      clsObserver?.disconnect()
    }
  }, [])

  return null
}
