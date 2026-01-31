'use client'

import Script from 'next/script'

/**
 * Google Analytics Component
 * 
 * Setup:
 * 1. Create Google Analytics 4 property
 * 2. Get Measurement ID (G-XXXXXXXXXX)
 * 3. Add NEXT_PUBLIC_GA_ID to .env.local
 * 4. This component will automatically track page views
 */

interface GoogleAnalyticsProps {
  gaId?: string
}

export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  const measurementId = gaId || process.env.NEXT_PUBLIC_GA_ID

  if (!measurementId) {
    // Don't render if GA ID is not configured
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
}

/**
 * Track custom events
 */
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

/**
 * Track page views
 */
export function trackPageView(path: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: path,
    })
  }
}

/**
 * Track e-commerce events
 */
export function trackPurchase(orderId: string, value: number, items: any[]) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', 'purchase', {
      transaction_id: orderId,
      value: value,
      currency: 'INR',
      items: items,
    })
  }
}







