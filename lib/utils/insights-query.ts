import { getBlogPostsOptimized, getBlogPostOptimized } from './blog-query'

/**
 * Get insights articles filtered by category
 * Insights are blog posts with category slug "insights" or "learning"
 */
export async function getInsightsPosts(limit = 12) {
  try {
    // Try "insights" category first, then "learning"
    let posts = await getBlogPostsOptimized(limit, 0, { category: 'insights' })
    
    // If no posts found with "insights", try "learning"
    if (posts.length === 0) {
      posts = await getBlogPostsOptimized(limit, 0, { category: 'learning' })
    }
    
    return posts
  } catch (error) {
    console.error('Error fetching insights posts:', error)
    return []
  }
}

/**
 * Get a single insight article by slug
 */
export async function getInsightPost(slug: string) {
  try {
    const post = await getBlogPostOptimized(slug)
    
    // Verify it's an insights/learning category post
    if (post && post.category) {
      const categorySlug = post.category.slug?.toLowerCase()
      if (categorySlug === 'insights' || categorySlug === 'learning') {
        return post
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching insight post:', error)
    return null
  }
}









