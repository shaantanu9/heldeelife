/**
 * Performance Monitoring Utilities
 * Track and measure app performance metrics
 */

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private enabled: boolean

  constructor() {
    this.enabled =
      typeof window !== 'undefined' &&
      'performance' in window &&
      process.env.NODE_ENV === 'production'
  }

  /**
   * Measure page load performance
   */
  measurePageLoad(): void {
    if (!this.enabled) return

    try {
      window.addEventListener('load', () => {
        const perfData = window.performance.timing
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
        const domContentLoaded =
          perfData.domContentLoadedEventEnd - perfData.navigationStart
        const firstPaint = perfData.responseEnd - perfData.navigationStart

        this.recordMetric('page-load', pageLoadTime, 'ms')
        this.recordMetric('dom-content-loaded', domContentLoaded, 'ms')
        this.recordMetric('first-paint', firstPaint, 'ms')

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Performance Metrics:', {
            pageLoad: `${pageLoadTime}ms`,
            domContentLoaded: `${domContentLoaded}ms`,
            firstPaint: `${firstPaint}ms`,
          })
        }
      })
    } catch (error) {
      console.error('Error measuring page load:', error)
    }
  }

  /**
   * Measure component render time
   */
  measureComponent(componentName: string): () => void {
    if (!this.enabled) return () => {}

    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime

      this.recordMetric(`component-${componentName}`, renderTime, 'ms')

      if (process.env.NODE_ENV === 'development' && renderTime > 100) {
        console.warn(
          `Slow component render: ${componentName} took ${renderTime.toFixed(2)}ms`
        )
      }
    }
  }

  /**
   * Measure API call performance
   */
  measureAPI(endpoint: string): () => void {
    if (!this.enabled) return () => {}

    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const apiTime = endTime - startTime

      this.recordMetric(`api-${endpoint}`, apiTime, 'ms')

      if (process.env.NODE_ENV === 'development' && apiTime > 1000) {
        console.warn(`Slow API call: ${endpoint} took ${apiTime.toFixed(2)}ms`)
      }
    }
  }

  /**
   * Measure image load time
   */
  measureImageLoad(imageUrl: string): void {
    if (!this.enabled) return

    const startTime = performance.now()

    const img = new Image()
    img.onload = () => {
      const endTime = performance.now()
      const loadTime = endTime - startTime
      this.recordMetric(`image-load`, loadTime, 'ms')
    }
    img.src = imageUrl
  }

  /**
   * Get Web Vitals metrics
   */
  async getWebVitals(): Promise<void> {
    if (!this.enabled) return

    try {
      // LCP - Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number
          loadTime?: number
        }
        if (lastEntry) {
          const lcp = lastEntry.renderTime || lastEntry.loadTime || 0
          this.recordMetric('lcp', lcp, 'ms')
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // FID - First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          const fid =
            (entry as PerformanceEventTiming).processingStart - entry.startTime
          this.recordMetric('fid', fid, 'ms')
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })

      // CLS - Cumulative Layout Shift
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        this.recordMetric('cls', clsValue, 'score')
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    } catch (error) {
      console.error('Error measuring Web Vitals:', error)
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(name: string, value: number, unit: string): void {
    this.metrics.push({
      name,
      value,
      unit,
      timestamp: Date.now(),
    })

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift()
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get average metric value
   */
  getAverageMetric(name: string): number | null {
    const metricValues = this.metrics
      .filter((m) => m.name === name)
      .map((m) => m.value)

    if (metricValues.length === 0) return null

    const sum = metricValues.reduce((a, b) => a + b, 0)
    return sum / metricValues.length
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = []
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Initialize on client side
if (typeof window !== 'undefined') {
  performanceMonitor.measurePageLoad()
  performanceMonitor.getWebVitals()
}









