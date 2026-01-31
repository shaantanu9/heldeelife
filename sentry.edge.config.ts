/**
 * Sentry Edge Configuration
 * Error monitoring for Edge runtime errors
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Filter out development errors
  beforeSend(event) {
    if (process.env.NODE_ENV === 'development') {
      return null
    }
    return event
  },
})







