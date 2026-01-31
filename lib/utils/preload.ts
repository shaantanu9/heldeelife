/**
 * Preload Utilities
 * Functions for preloading critical resources
 */

/**
 * Preload critical resources for faster page loads
 */
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return

  // Preload critical fonts
  const fontPreloads = [
    {
      href: '/fonts/inter.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    {
      href: '/fonts/playfair.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
  ]

  fontPreloads.forEach(({ href, as, type, crossOrigin }) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    if (type) link.setAttribute('type', type)
    if (crossOrigin) link.setAttribute('crossorigin', crossOrigin)
    document.head.appendChild(link)
  })
}

/**
 * Prefetch next page resources
 */
export function prefetchRoute(href: string) {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = href
  link.as = 'document'
  document.head.appendChild(link)
}

/**
 * Preload images that are above the fold
 */
export function preloadImage(src: string) {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = src
  link.as = 'image'
  document.head.appendChild(link)
}

/**
 * Preconnect to external domains
 */
export function preconnectDomain(url: string) {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = url
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}









