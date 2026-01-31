/**
 * Comprehensive Analytics Tracking System
 * Tracks conversion rates, cart abandonment, AOV, and user behavior
 */

export interface AnalyticsEvent {
  event: string
  category: string
  action: string
  label?: string
  value?: number
  metadata?: Record<string, any>
}

export interface ConversionMetrics {
  conversionRate: number
  cartAbandonmentRate: number
  averageOrderValue: number
  checkoutCompletionRate: number
  productViewToCartRate: number
  cartToCheckoutRate: number
}

/**
 * Track ecommerce events
 */
export class AnalyticsTracker {
  private static sessionId: string | null = null
  private static userId: string | null = null

  /**
   * Initialize analytics tracking
   */
  static init(userId?: string) {
    if (typeof window === 'undefined') return

    // Generate session ID
    this.sessionId =
      sessionStorage.getItem('analytics_session_id') ||
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('analytics_session_id', this.sessionId)

    if (userId) {
      this.userId = userId
    }

    // Track page view
    this.trackPageView()
  }

  /**
   * Track page view
   */
  static trackPageView(page?: string) {
    if (typeof window === 'undefined') return

    const pageName = page || window.location.pathname

    this.trackEvent({
      event: 'page_view',
      category: 'Navigation',
      action: 'Page View',
      label: pageName,
      metadata: {
        url: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Track product view
   */
  static trackProductView(productId: string, productName: string, price: number) {
    this.trackEvent({
      event: 'product_view',
      category: 'Ecommerce',
      action: 'Product View',
      label: productName,
      value: price,
      metadata: {
        product_id: productId,
        product_name: productName,
        price,
      },
    })

    // Send to API for database tracking
    this.sendToAPI('product_view', {
      product_id: productId,
      product_name: productName,
      price,
    })
  }

  /**
   * Track add to cart
   */
  static trackAddToCart(
    productId: string,
    productName: string,
    price: number,
    quantity: number = 1
  ) {
    this.trackEvent({
      event: 'add_to_cart',
      category: 'Ecommerce',
      action: 'Add to Cart',
      label: productName,
      value: price * quantity,
      metadata: {
        product_id: productId,
        product_name: productName,
        price,
        quantity,
        total_value: price * quantity,
      },
    })

    this.sendToAPI('cart_add', {
      product_id: productId,
      product_name: productName,
      price,
      quantity,
    })
  }

  /**
   * Track remove from cart
   */
  static trackRemoveFromCart(
    productId: string,
    productName: string,
    price: number
  ) {
    this.trackEvent({
      event: 'remove_from_cart',
      category: 'Ecommerce',
      action: 'Remove from Cart',
      label: productName,
      value: price,
      metadata: {
        product_id: productId,
        product_name: productName,
        price,
      },
    })

    this.sendToAPI('cart_remove', {
      product_id: productId,
      product_name: productName,
      price,
    })
  }

  /**
   * Track cart abandonment
   */
  static trackCartAbandonment(cartValue: number, itemCount: number) {
    this.trackEvent({
      event: 'cart_abandonment',
      category: 'Ecommerce',
      action: 'Cart Abandoned',
      value: cartValue,
      metadata: {
        cart_value: cartValue,
        item_count: itemCount,
        timestamp: new Date().toISOString(),
      },
    })

    this.sendToAPI('cart_abandoned', {
      cart_value: cartValue,
      item_count: itemCount,
    })
  }

  /**
   * Track checkout start
   */
  static trackCheckoutStart(cartValue: number, itemCount: number) {
    this.trackEvent({
      event: 'checkout_start',
      category: 'Ecommerce',
      action: 'Checkout Started',
      value: cartValue,
      metadata: {
        cart_value: cartValue,
        item_count: itemCount,
      },
    })
  }

  /**
   * Track checkout step
   */
  static trackCheckoutStep(step: number, stepName: string) {
    this.trackEvent({
      event: 'checkout_step',
      category: 'Ecommerce',
      action: 'Checkout Step',
      label: stepName,
      value: step,
      metadata: {
        step,
        step_name: stepName,
      },
    })
  }

  /**
   * Track purchase
   */
  static trackPurchase(
    orderId: string,
    orderNumber: string,
    totalAmount: number,
    items: Array<{ productId: string; name: string; price: number; quantity: number }>
  ) {
    this.trackEvent({
      event: 'purchase',
      category: 'Ecommerce',
      action: 'Purchase',
      label: orderNumber,
      value: totalAmount,
      metadata: {
        order_id: orderId,
        order_number: orderNumber,
        total_amount: totalAmount,
        item_count: items.length,
        items,
      },
    })

    this.sendToAPI('purchase', {
      order_id: orderId,
      order_number: orderNumber,
      total_amount: totalAmount,
      items,
    })
  }

  /**
   * Track conversion funnel
   */
  static trackConversionFunnel(
    step: 'view' | 'cart' | 'checkout' | 'purchase',
    metadata?: Record<string, any>
  ) {
    this.trackEvent({
      event: 'conversion_funnel',
      category: 'Ecommerce',
      action: 'Conversion Funnel',
      label: step,
      metadata: {
        step,
        ...metadata,
      },
    })
  }

  /**
   * Track CTA click
   */
  static trackCTAClick(ctaName: string, location: string) {
    this.trackEvent({
      event: 'cta_click',
      category: 'Engagement',
      action: 'CTA Click',
      label: ctaName,
      metadata: {
        cta_name: ctaName,
        location,
      },
    })
  }

  /**
   * Track search
   */
  static trackSearch(query: string, resultsCount: number) {
    this.trackEvent({
      event: 'search',
      category: 'Engagement',
      action: 'Search',
      label: query,
      value: resultsCount,
      metadata: {
        query,
        results_count: resultsCount,
      },
    })

    this.sendToAPI('product_search', {
      search_query: query,
      results_count: resultsCount,
    })
  }

  /**
   * Track wishlist action
   */
  static trackWishlistAction(
    action: 'add' | 'remove',
    productId: string,
    productName: string
  ) {
    this.trackEvent({
      event: 'wishlist',
      category: 'Engagement',
      action: action === 'add' ? 'Add to Wishlist' : 'Remove from Wishlist',
      label: productName,
      metadata: {
        product_id: productId,
        product_name: productName,
      },
    })
  }

  /**
   * Track price drop alert subscription
   */
  static trackPriceAlertSubscribe(productId: string, productName: string) {
    this.trackEvent({
      event: 'price_alert_subscribe',
      category: 'Engagement',
      action: 'Price Alert Subscribe',
      label: productName,
      metadata: {
        product_id: productId,
        product_name: productName,
      },
    })
  }

  /**
   * Track abandoned cart recovery
   */
  static trackCartRecovery(cartId: string, recovered: boolean) {
    this.trackEvent({
      event: 'cart_recovery',
      category: 'Ecommerce',
      action: recovered ? 'Cart Recovered' : 'Cart Recovery Attempt',
      metadata: {
        cart_id: cartId,
        recovered,
      },
    })
  }

  /**
   * Track generic event
   */
  static trackEvent(event: AnalyticsEvent) {
    if (typeof window === 'undefined') return

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event)
    }

    // Send to Google Analytics (if available)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.metadata,
      })
    }

    // Store in localStorage for batch sending
    this.storeEvent(event)
  }

  /**
   * Store event in localStorage for batch sending
   */
  private static storeEvent(event: AnalyticsEvent) {
    if (typeof window === 'undefined') return

    try {
      const events = JSON.parse(
        localStorage.getItem('analytics_events') || '[]'
      )
      events.push({
        ...event,
        timestamp: new Date().toISOString(),
        session_id: this.sessionId,
        user_id: this.userId,
      })

      // Keep only last 100 events
      const recentEvents = events.slice(-100)
      localStorage.setItem('analytics_events', JSON.stringify(recentEvents))
    } catch (error) {
      console.error('Error storing analytics event:', error)
    }
  }

  /**
   * Send event to API
   */
  private static async sendToAPI(
    eventType: string,
    data: Record<string, any>
  ) {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          data,
          session_id: this.sessionId,
          user_id: this.userId,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (error) {
      // Silently fail - analytics should not break the app
      console.error('Error sending analytics event:', error)
    }
  }

  /**
   * Get conversion metrics
   */
  static async getConversionMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<ConversionMetrics> {
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('start_date', startDate.toISOString())
      if (endDate) params.set('end_date', endDate.toISOString())

      const response = await fetch(`/api/analytics/metrics?${params.toString()}`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Error fetching conversion metrics:', error)
    }

    // Return default metrics
    return {
      conversionRate: 0,
      cartAbandonmentRate: 0,
      averageOrderValue: 0,
      checkoutCompletionRate: 0,
      productViewToCartRate: 0,
      cartToCheckoutRate: 0,
    }
  }

  /**
   * Flush stored events to server
   */
  static async flushEvents() {
    if (typeof window === 'undefined') return

    try {
      const events = JSON.parse(
        localStorage.getItem('analytics_events') || '[]'
      )

      if (events.length === 0) return

      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      })

      // Clear stored events
      localStorage.removeItem('analytics_events')
    } catch (error) {
      console.error('Error flushing analytics events:', error)
    }
  }
}

// Auto-flush events every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    AnalyticsTracker.flushEvents()
  }, 30000)

  // Flush on page unload
  window.addEventListener('beforeunload', () => {
    AnalyticsTracker.flushEvents()
  })
}









