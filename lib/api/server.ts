/**
 * Server-Side API Utilities
 * Uses Next.js fetch caching for optimal performance
 */

import { cache } from 'react'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  isSupabaseConnectionError,
  safeSupabaseQuery,
} from '@/lib/utils/supabase-error-handler'

// Cache wrapper for Next.js fetch
export const fetchWithCache = cache(
  async (url: string, options?: RequestInit) => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}${url}`, {
      ...options,
      // Next.js will cache this request
      next: {
        revalidate: 60, // Revalidate every 60 seconds
        tags: [url], // Tag for on-demand revalidation
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }

    return response.json()
  }
)

// Helper to check if string is a UUID
const isUUID = (str: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Server-side product fetching with Next.js cache
// Supports both slug and ID for backward compatibility
export const getProduct = cache(async (identifier: string) => {
  // Determine if identifier is UUID (id) or slug
  const isId = isUUID(identifier)

  let query = supabaseAdmin
    .from('products')
    .select(
      `
      *,
      product_categories (
        id,
        name,
        slug
      )
    `
    )
    .eq('is_active', true)

  if (isId) {
    query = query.eq('id', identifier)
  } else {
    query = query.eq('slug', identifier)
  }

  const { data, error, connectionError } = await safeSupabaseQuery(
    () => query.single(),
    null
  )

  if (connectionError) {
    console.error('Database connection error - returning null')
    return null
  }

  if (error || !data) {
    if (error && !isSupabaseConnectionError(error)) {
      console.error('Error fetching product:', error)
    }
    return null
  }

  // Get inventory (don't fail if inventory doesn't exist)
  const { data: inventory } = await safeSupabaseQuery(
    () =>
      supabaseAdmin
        .from('inventory')
        .select('available_quantity, quantity, reserved_quantity')
        .eq('product_id', data.id)
        .maybeSingle(),
    null
  ).then((result) => ({ data: result.data, error: result.error }))

  return {
    ...data,
    inStock: (inventory?.available_quantity || 0) > 0,
    stockQuantity: inventory?.available_quantity || 0,
    totalQuantity: inventory?.quantity || 0,
  }
})

// Server-side products list with caching
export const getProducts = cache(
  async (filters?: {
    category?: string
    featured?: boolean
    search?: string
    limit?: number
  }) => {
    let query = supabaseAdmin
      .from('products')
      .select(
        `
      *,
      product_categories (
        id,
        name,
        slug
      )
    `
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (filters?.category) {
      const { data: categoryData } = await supabaseAdmin
        .from('product_categories')
        .select('id')
        .eq('slug', filters.category)
        .single()

      if (categoryData) {
        query = query.eq('category_id', categoryData.id)
      }
    }

    if (filters?.featured) {
      query = query.eq('is_featured', true)
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`
      )
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data: products, error, connectionError } = await safeSupabaseQuery(
      () => query,
      []
    )

    // Always return empty array on connection errors (already logged in safeSupabaseQuery)
    if (connectionError) {
      return []
    }

    // Return empty array on any other errors too (graceful degradation)
    if (error) {
      // Only log non-connection errors to avoid duplicate logging
      if (!isSupabaseConnectionError(error)) {
        console.error('Error fetching products:', error)
      }
      return []
    }

    if (!products || products.length === 0) {
      return []
    }

    // Get inventory for all products
    const productIds = products.map((p) => p.id)
    const { data: inventory } = await safeSupabaseQuery(
      () =>
        supabaseAdmin
          .from('inventory')
          .select('product_id, available_quantity')
          .in('product_id', productIds),
      []
    ).then((result) => ({ data: result.data, error: result.error }))

    const inventoryMap = new Map(
      inventory?.map((inv) => [inv.product_id, inv.available_quantity]) || []
    )

    return products.map((product) => ({
      ...product,
      inStock: (inventoryMap.get(product.id) || 0) > 0,
      stockQuantity: inventoryMap.get(product.id) || 0,
    }))
  }
)

// Server-side product categories with caching
export const getProductCategories = cache(async () => {
  const { data, error, connectionError } = await safeSupabaseQuery(
    () =>
      supabaseAdmin
        .from('product_categories')
        .select('*')
        .order('name', { ascending: true }),
    []
  )

  if (connectionError) {
    console.error('Database connection error - returning empty array')
    return []
  }

  if (error) {
    if (!isSupabaseConnectionError(error)) {
      console.error('Error fetching categories:', error)
    }
    return []
  }

  return data || []
})

// Server-side blog posts with caching
export const getBlogPosts = cache(
  async (filters?: {
    status?: string
    category?: string
    limit?: number
    offset?: number
  }) => {
    let query = supabaseAdmin
      .from('blog_posts')
      .select(
        `
      *,
      category:blog_categories(*),
      tags:blog_post_tags(
        tag:blog_tags(*)
      ),
      author:users(id, email, full_name)
    `
      )
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    } else {
      query = query.eq('status', 'published')
    }

    if (filters?.category) {
      query = query.eq('category_id', filters.category)
    }

    const limit = filters?.limit || 20
    const offset = filters?.offset || 0

    const { data, error, connectionError } = await safeSupabaseQuery(
      () => query.range(offset, offset + limit - 1),
      []
    )

    if (connectionError) {
      console.error('Database connection error - returning empty array')
      return []
    }

    if (error) {
      if (!isSupabaseConnectionError(error)) {
        console.error('Error fetching blog posts:', error)
      }
      return []
    }

    // Transform tags data
    return (data || []).map((post: any) => ({
      ...post,
      tags: post.tags?.map((pt: any) => pt.tag) || [],
    }))
  }
)
