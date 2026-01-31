/**
 * Sentry Client Configuration
 * Error monitoring for client-side errors
 * 
 * Setup:
 * 1. Create account at https://sentry.io
 * 2. Create new project (Next.js)
 * 3. Get DSN from project settings
 * 4. Add NEXT_PUBLIC_SENTRY_DSN to .env.local
 * 5. Run: npm install @sentry/nextjs
 * 6. Run: npx @sentry/wizard@latest -i nextjs
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Capture unhandled promise rejections
  captureUnhandledRejections: true,

  // Filter out development errors
  beforeSend(event, hint) {
    // Don't send errors in development
    if (process.env.NODE_ENV === 'development') {
      return null
    }

    // Filter out known non-critical errors
    const error = hint.originalException
    if (error instanceof Error) {
      // Filter out network errors that are expected
      if (
        error.message.includes('NetworkError') ||
        error.message.includes('Failed to fetch')
      ) {
        return null
      }
    }

    return event
  },

  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'atomicFindClose',
    // Network errors
    'NetworkError',
    'Failed to fetch',
    // Third-party scripts
    'fb_xd_fragment',
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
  ],

  // Release tracking
  release: process.env.npm_package_version || undefined,
})







