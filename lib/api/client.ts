/**
 * Centralized API Client
 * Provides a consistent interface for all API calls with error handling
 */

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions extends RequestInit {
  method?: RequestMethod
  params?: Record<string, string | number | boolean | null | undefined>
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ApiClient {
  private baseURL: string

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options

    // Build URL with query params
    // Handle relative baseURL by using window.location.origin in browser
    let baseURL = this.baseURL
    if (typeof window !== 'undefined' && baseURL.startsWith('/')) {
      baseURL = `${window.location.origin}${baseURL}`
    }

    const url = new URL(endpoint, baseURL)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })
    }

    // Set default headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    }

    try {
      const response = await fetch(url.toString(), {
        ...fetchOptions,
        headers,
      })

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      const isJson = contentType?.includes('application/json')

      let data: any
      if (isJson) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        throw new ApiError(
          data?.error || data?.message || 'Request failed',
          response.status,
          data
        )
      }

      return data as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0,
        error
      )
    }
  }

  async get<T>(
    endpoint: string,
    params?: RequestOptions['params']
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params })
  }

  async post<T>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'body' | 'method'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    })
  }

  async put<T>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'body' | 'method'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    })
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'body' | 'method'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    })
  }

  async delete<T>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    })
  }

  // For file uploads
  async upload<T>(
    endpoint: string,
    formData: FormData,
    options?: Omit<RequestOptions, 'body' | 'method' | 'headers'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
      ...options,
    })
  }
}

export const apiClient = new ApiClient()

export { ApiError }
