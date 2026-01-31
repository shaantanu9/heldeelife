/**
 * Performance Utilities
 * Web Vitals tracking and performance monitoring
 */

export interface WebVital {
  id: string
  name: string
  value: number
  label: string
  delta?: number
  rating?: 'good' | 'needs-improvement' | 'poor'
}

/**
 * Report Web Vitals to analytics
 * Can be extended to send to Google Analytics, Vercel Analytics, etc.
 */
export function reportWebVitals(metric: WebVital) {
  // Only report in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Web Vitals]', metric)
    return
  }

  // Send to analytics service (e.g., Vercel Analytics, Google Analytics)
  // Example: sendToAnalytics(metric)

  // For now, log to console in production (can be replaced with actual analytics)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      event_label: metric.label,
      non_interaction: true,
    })
  }
}

/**
 * Measure page load performance
 */
export function measurePageLoad() {
  if (typeof window === 'undefined') return

  window.addEventListener('load', () => {
    const perfData = window.performance.timing
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
    const domContentLoaded =
      perfData.domContentLoadedEventEnd - perfData.navigationStart
    const firstByte = perfData.responseStart - perfData.navigationStart

    reportWebVitals({
      id: 'page-load',
      name: 'PageLoad',
      value: pageLoadTime,
      label: 'page-load',
    })

    reportWebVitals({
      id: 'dom-content-loaded',
      name: 'DOMContentLoaded',
      value: domContentLoaded,
      label: 'dom-content-loaded',
    })

    reportWebVitals({
      id: 'first-byte',
      name: 'FirstByte',
      value: firstByte,
      label: 'first-byte',
    })
  })
}

/**
 * Preload critical resources
 */
export function preloadResource(
  href: string,
  as: string,
  crossOrigin?: string
) {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  if (crossOrigin) {
    link.crossOrigin = crossOrigin
  }
  document.head.appendChild(link)
}

/**
 * Prefetch resources for faster navigation
 */
export function prefetchResource(href: string) {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = href
  document.head.appendChild(link)
}

/**
 * DNS prefetch for external domains
 */
export function dnsPrefetch(href: string) {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'dns-prefetch'
  link.href = href
  document.head.appendChild(link)
}

/**
 * Preconnect to external domains
 */
export function preconnect(href: string, crossOrigin?: string) {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = href
  if (crossOrigin) {
    link.crossOrigin = crossOrigin
  }
  document.head.appendChild(link)
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  options?: IntersectionObserverInit
) {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    // Fallback: load immediately
    img.src = src
    return
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        img.src = src
        observer.unobserve(img)
      }
    })
  }, options)

  observer.observe(img)
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void
  }
}
