import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * Optimized query for blog posts listing
 * Uses select with minimal fields for better performance
 */
export async function getBlogPostsOptimized(
  limit = 20,
  offset = 0,
  filters?: {
    category?: string
    tag?: string
  }
) {
  try {
    // First, get category_id if filtering by category slug
    let categoryId: string | undefined
    if (filters?.category) {
      const { data: category } = await supabaseAdmin
        .from('blog_categories')
        .select('id')
        .eq('slug', filters.category)
        .single()
      if (category) {
        categoryId = category.id
      } else {
        // Category not found, return empty array
        return []
      }
    }

    // First, get tag_id if filtering by tag slug
    let tagId: string | undefined
    if (filters?.tag) {
      const { data: tag } = await supabaseAdmin
        .from('blog_tags')
        .select('id')
        .eq('slug', filters.tag)
        .single()
      if (tag) {
        tagId = tag.id
      } else {
        // Tag not found, return empty array
        return []
      }
    }

    let query = supabaseAdmin
      .from('blog_posts')
      .select(
        `
        id,
        title,
        slug,
        excerpt,
        featured_image,
        published_at,
        reading_time,
        views_count,
        created_at,
        category:blog_categories(id, name, slug),
        tags:blog_post_tags(
          tag:blog_tags(id, name, slug)
        )
      `
      )
      .eq('status', 'published')

    // Filter by category_id
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    // Filter by tag - need to use a different approach
    if (tagId) {
      // Get post IDs that have this tag
      const { data: postTags } = await supabaseAdmin
        .from('blog_post_tags')
        .select('post_id')
        .eq('tag_id', tagId)

      if (postTags && postTags.length > 0) {
        const postIds = postTags.map((pt) => pt.post_id)
        query = query.in('id', postIds)
      } else {
        // No posts with this tag, return empty
        return []
      }
    }

    const { data, error } = await query
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching blog posts:', error)
      // Return empty array instead of throwing to prevent build failures
      return []
    }

    return (data || []).map((post: any) => ({
      ...post,
      tags: post.tags?.map((pt: any) => pt.tag) || [],
    }))
  } catch (error) {
    console.error('Unexpected error fetching blog posts:', error)
    return []
  }
}

/**
 * Get blog categories
 */
export async function getBlogCategories() {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_categories')
      .select('id, name, slug, description')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching blog categories:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching blog categories:', error)
    return []
  }
}

/**
 * Get blog tags
 */
export async function getBlogTags() {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_tags')
      .select('id, name, slug')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching blog tags:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching blog tags:', error)
    return []
  }
}

/**
 * Optimized query for single blog post
 * Includes all necessary fields for full post view
 */
export async function getBlogPostOptimized(slug: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select(
        `
        *,
        category:blog_categories(id, name, slug, description),
        tags:blog_post_tags(
          tag:blog_tags(id, name, slug)
        )
      `
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error || !data) {
      return null
    }

    return {
      ...data,
      tags: data.tags?.map((pt: any) => pt.tag) || [],
    }
  } catch (error) {
    console.error('Unexpected error fetching blog post:', error)
    return null
  }
}

/**
 * Get blog post slugs for static generation
 */
export async function getBlogPostSlugs() {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select('slug')
      .eq('status', 'published')

    if (error) {
      console.error('Error fetching blog post slugs:', error)
      return []
    }

    return (data || []).map((post) => post.slug)
  } catch (error) {
    console.error('Unexpected error fetching blog post slugs:', error)
    return []
  }
}

/**
 * Get related blog posts based on category and tags
 * Useful for internal linking and LLM understanding of content relationships
 */
export async function getRelatedBlogPosts(
  currentPostId: string,
  categoryId?: string,
  tagIds?: string[],
  limit: number = 3
) {
  try {
    let query = supabaseAdmin
      .from('blog_posts')
      .select(
        `
        id,
        title,
        slug,
        excerpt,
        featured_image,
        published_at,
        category:blog_categories(id, name, slug)
      `
      )
      .eq('status', 'published')
      .neq('id', currentPostId) // Exclude current post
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit * 2) // Get more to filter

    // Filter by category if available
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching related posts:', error)
      return []
    }

    // If we have tag IDs, prioritize posts with matching tags
    let posts = data || []
    if (tagIds && tagIds.length > 0) {
      // Get posts with matching tags
      const { data: postTags } = await supabaseAdmin
        .from('blog_post_tags')
        .select('post_id')
        .in('tag_id', tagIds)
        .neq('post_id', currentPostId)

      if (postTags && postTags.length > 0) {
        const relatedPostIds = new Set(postTags.map((pt) => pt.post_id))
        // Prioritize posts with matching tags
        const withTags = posts.filter((p) => relatedPostIds.has(p.id))
        const withoutTags = posts.filter((p) => !relatedPostIds.has(p.id))
        posts = [...withTags, ...withoutTags]
      }
    }

    return posts.slice(0, limit)
  } catch (error) {
    console.error('Unexpected error fetching related posts:', error)
    return []
  }
}
