/**
 * Blog API Hooks
 * Centralized hooks for blog-related API calls with caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/query-keys'
import { BlogPost, CreateBlogPostInput } from '@/lib/types/blog'

export interface BlogPostFilters {
  status?: string
  category?: string
  tag?: string
  limit?: number
  offset?: number
}

// Get all blog posts
export function useBlogPosts(filters?: BlogPostFilters) {
  return useQuery({
    queryKey: queryKeys.blogPosts.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<{
        posts: BlogPost[]
        total: number
      }>('/blog/posts', filters)
      return response
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get single blog post by ID
export function useBlogPost(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.blogPosts.detail(id!),
    queryFn: async () => {
      const response = await apiClient.get<{ post: BlogPost }>(
        `/blog/posts/${id}`
      )
      return response.post
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get blog post by slug
// Note: This requires fetching all posts and filtering by slug
// Consider creating a dedicated /api/blog/posts/slug/[slug] endpoint for better performance
export function useBlogPostBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.blogPosts.bySlug(slug!),
    queryFn: async () => {
      // Fetch posts and filter by slug client-side
      // For better performance, consider creating a dedicated API endpoint
      const response = await apiClient.get<{ posts: BlogPost[] }>(
        '/blog/posts',
        { limit: 100 } // Fetch more posts to increase chance of finding the slug
      )
      const post = response.posts.find((p) => p.slug === slug)
      if (!post) {
        throw new Error('Blog post not found')
      }
      return post
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Create blog post (admin only)
export function useCreateBlogPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateBlogPostInput) => {
      const response = await apiClient.post<{ post: BlogPost }>(
        '/blog/posts',
        data
      )
      return response.post
    },
    onSuccess: () => {
      // Invalidate blog posts list
      queryClient.invalidateQueries({
        queryKey: queryKeys.blogPosts.lists(),
      })
    },
  })
}

// Update blog post (admin only)
export function useUpdateBlogPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: CreateBlogPostInput & { id: string }) => {
      const response = await apiClient.put<{ post: BlogPost }>(
        `/blog/posts/${id}`,
        data
      )
      return response.post
    },
    onSuccess: (post) => {
      // Update cache for this specific post
      queryClient.setQueryData(queryKeys.blogPosts.detail(post.id), post)
      queryClient.setQueryData(queryKeys.blogPosts.bySlug(post.slug), post)
      // Invalidate blog posts list
      queryClient.invalidateQueries({
        queryKey: queryKeys.blogPosts.lists(),
      })
    },
  })
}

// Delete blog post (admin only)
export function useDeleteBlogPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/blog/posts/${id}`)
      return id
    },
    onSuccess: (id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.blogPosts.detail(id),
      })
      // Invalidate blog posts list
      queryClient.invalidateQueries({
        queryKey: queryKeys.blogPosts.lists(),
      })
    },
  })
}

// Get blog categories
export function useBlogCategories() {
  return useQuery({
    queryKey: queryKeys.blogCategories.lists(),
    queryFn: async () => {
      const response = await apiClient.get<{ categories: any[] }>(
        '/blog/categories'
      )
      return response.categories
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (categories don't change often)
  })
}

// Get blog tags
export function useBlogTags() {
  return useQuery({
    queryKey: queryKeys.blogTags.lists(),
    queryFn: async () => {
      const response = await apiClient.get<{ tags: any[] }>('/blog/tags')
      return response.tags
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (tags don't change often)
  })
}
