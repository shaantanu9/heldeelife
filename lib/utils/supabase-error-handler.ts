/**
 * Supabase Error Handler Utilities
 * Provides graceful error handling for Supabase connection failures
 */

export interface SupabaseErrorInfo {
  isConnectionError: boolean
  isPaused: boolean
  isNetworkError: boolean
  isConfigError: boolean
  userMessage: string
  technicalMessage: string
  suggestion: string
}

/**
 * Check if error is a Supabase connection error
 * Handles both Error instances and Supabase error objects
 */
export function isSupabaseConnectionError(error: unknown): boolean {
  if (!error) return false

  // Handle Error instances
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    const cause = (error as any).cause

    return (
      message.includes('fetch failed') ||
      message.includes('enotfound') ||
      message.includes('econnrefused') ||
      message.includes('network') ||
      (cause instanceof Error &&
        (cause.message.includes('ENOTFOUND') ||
          cause.message.includes('ECONNREFUSED') ||
          cause.message.includes('getaddrinfo')))
    )
  }

  // Handle Supabase error objects (with message, details, etc.)
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any
    const message = String(errorObj.message || '').toLowerCase()
    const details = String(errorObj.details || '').toLowerCase()
    const hint = String(errorObj.hint || '').toLowerCase()
    const code = String(errorObj.code || '').toLowerCase()
    
    // Combine all error text for comprehensive checking
    const allErrorText = `${message} ${details} ${hint} ${code}`.toLowerCase()

    return (
      message.includes('fetch failed') ||
      message.includes('enotfound') ||
      message.includes('econnrefused') ||
      message.includes('network') ||
      details.includes('fetch failed') ||
      details.includes('enotfound') ||
      details.includes('econnrefused') ||
      details.includes('getaddrinfo') ||
      allErrorText.includes('enotfound') ||
      allErrorText.includes('econnrefused') ||
      allErrorText.includes('getaddrinfo') ||
      allErrorText.includes('fetch failed')
    )
  }

  // Handle string errors
  if (typeof error === 'string') {
    const message = error.toLowerCase()
    return (
      message.includes('fetch failed') ||
      message.includes('enotfound') ||
      message.includes('econnrefused') ||
      message.includes('network') ||
      message.includes('getaddrinfo')
    )
  }

  return false
}

/**
 * Check if error indicates Supabase project is paused
 */
export function isSupabasePaused(error: unknown): boolean {
  if (!error) return false

  let message = ''
  let details = ''
  let cause: any = null

  if (error instanceof Error) {
    message = error.message.toLowerCase()
    cause = (error as any).cause
  } else if (typeof error === 'object' && error !== null) {
    const errorObj = error as any
    message = String(errorObj.message || '').toLowerCase()
    details = String(errorObj.details || '').toLowerCase()
  } else if (typeof error === 'string') {
    message = error.toLowerCase()
  }

  return (
    message.includes('econnrefused') ||
    message.includes('connection refused') ||
    details.includes('econnrefused') ||
    details.includes('connection refused') ||
    (cause instanceof Error &&
      (cause.message.includes('ECONNREFUSED') ||
        cause.message.includes('connection refused')))
  )
}

/**
 * Check if error is a network/DNS error
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false

  let message = ''
  let details = ''
  let cause: any = null

  if (error instanceof Error) {
    message = error.message.toLowerCase()
    cause = (error as any).cause
  } else if (typeof error === 'object' && error !== null) {
    const errorObj = error as any
    message = String(errorObj.message || '').toLowerCase()
    details = String(errorObj.details || '').toLowerCase()
  } else if (typeof error === 'string') {
    message = error.toLowerCase()
  }

  return (
    message.includes('enotfound') ||
    message.includes('getaddrinfo') ||
    message.includes('dns') ||
    details.includes('enotfound') ||
    details.includes('getaddrinfo') ||
    details.includes('dns') ||
    (cause instanceof Error &&
      (cause.message.includes('ENOTFOUND') ||
        cause.message.includes('getaddrinfo')))
  )
}

/**
 * Check if error is a configuration error
 */
export function isConfigError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()

  return (
    message.includes('missing env') ||
    message.includes('invalid') ||
    message.includes('configuration')
  )
}

/**
 * Analyze Supabase error and provide user-friendly information
 */
export function analyzeSupabaseError(error: unknown): SupabaseErrorInfo {
  const isConnection = isSupabaseConnectionError(error)
  const isPaused = isSupabasePaused(error)
  const isNetwork = isNetworkError(error)
  const isConfig = isConfigError(error)

  let userMessage = 'Unable to connect to database'
  let technicalMessage = ''
  let suggestion = 'Please check your connection and try again'

  // Extract technical message from different error types
  if (error instanceof Error) {
    technicalMessage = error.message
  } else if (typeof error === 'object' && error !== null) {
    const errorObj = error as any
    technicalMessage = errorObj.details || errorObj.message || String(error)
  } else {
    technicalMessage = String(error)
  }

  if (isPaused) {
    userMessage = 'Database connection unavailable'
    suggestion =
      'Your Supabase project may be paused. Please check your Supabase dashboard and resume the project if needed.'
  } else if (isNetwork) {
    userMessage = 'Network connection error'
    suggestion =
      'Unable to reach the database server. Please check your internet connection and Supabase project status.'
  } else if (isConfig) {
    userMessage = 'Database configuration error'
    suggestion =
      'Please check your environment variables (.env.local) and ensure SUPABASE_URL and API keys are correct.'
  } else if (isConnection) {
    userMessage = 'Database connection failed'
    suggestion =
      'Please verify your Supabase project is active and your connection settings are correct.'
  }

  return {
    isConnectionError: isConnection,
    isPaused,
    isNetworkError: isNetwork,
    isConfigError: isConfig,
    userMessage,
    technicalMessage,
    suggestion,
  }
}

/**
 * Safe Supabase query wrapper with error handling
 */
export async function safeSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallbackData: T | null = null
): Promise<{ data: T | null; error: any; connectionError: boolean }> {
  try {
    const result = await queryFn()

    // Check if error is a connection error (from result.error)
    if (result.error) {
      if (isSupabaseConnectionError(result.error)) {
        const errorInfo = analyzeSupabaseError(result.error)
        console.error('Supabase connection error (result.error):', errorInfo.technicalMessage)
        console.error('Suggestion:', errorInfo.suggestion)

        return {
          data: fallbackData,
          error: {
            ...result.error,
            userMessage: errorInfo.userMessage,
            suggestion: errorInfo.suggestion,
          },
          connectionError: true,
        }
      }
    }

    return {
      data: result.data,
      error: result.error,
      connectionError: false,
    }
  } catch (error) {
    // Handle errors thrown during query execution
    if (isSupabaseConnectionError(error)) {
      const errorInfo = analyzeSupabaseError(error)
      console.error('Supabase connection error (thrown):', errorInfo.technicalMessage)
      console.error('Suggestion:', errorInfo.suggestion)

      return {
        data: fallbackData,
        error: {
          message: errorInfo.userMessage,
          suggestion: errorInfo.suggestion,
          originalError: error,
        },
        connectionError: true,
      }
    }

    // For non-connection errors, still return fallback data
    console.error('Non-connection error in safeSupabaseQuery:', error)
    return {
      data: fallbackData,
      error: error instanceof Error ? error : new Error(String(error)),
      connectionError: false,
    }
  }
}

/**
 * Create a user-friendly error response for API routes
 */
export function createSupabaseErrorResponse(error: unknown) {
  const errorInfo = analyzeSupabaseError(error)

  return {
    error: errorInfo.userMessage,
    suggestion: errorInfo.suggestion,
    connectionError: errorInfo.isConnectionError,
    paused: errorInfo.isPaused,
  }
}


