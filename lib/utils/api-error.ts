/**
 * API Error Handling Utilities
 * Standardized error responses and error handling
 */

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  }
  return Response.json(response, { status: statusCode })
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: ApiError | Error | string,
  statusCode?: number
): Response {
  let apiError: ApiError

  if (error instanceof ApiError) {
    apiError = error
  } else if (error instanceof Error) {
    apiError = new ApiError(statusCode || 500, error.message)
  } else {
    apiError = new ApiError(statusCode || 500, error)
  }

  const response: ApiResponse = {
    success: false,
    error: {
      message: apiError.message,
      code: apiError.code,
      details: apiError.details,
    },
  }

  return Response.json(response, { status: apiError.statusCode })
}

/**
 * Handle API route errors consistently
 */
export function handleApiError(error: unknown): Response {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    return errorResponse(error)
  }

  if (error instanceof Error) {
    return errorResponse(new ApiError(500, error.message))
  }

  return errorResponse(new ApiError(500, 'Internal server error'))
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
  fields: string[]
): void {
  const missing = fields.filter((field) => !data[field] && data[field] !== 0)

  if (missing.length > 0) {
    throw new ApiError(
      400,
      `Missing required fields: ${missing.join(', ')}`,
      'VALIDATION_ERROR',
      { missingFields: missing }
    )
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (Indian format)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}









