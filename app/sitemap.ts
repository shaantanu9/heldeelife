import { MetadataRoute } from 'next'
import { getBlogPostSlugs } from '@/lib/utils/blog-query'
import { supabaseAdmin } from '@/lib/supabase/server'

export const revalidate = 3600 // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'

  // Get all published blog posts with optimized query
  const slugs = await getBlogPostSlugs()

  // Fetch update times in batch
  const { data: posts } = await supabaseAdmin
    .from('blog_posts')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .in('slug', slugs)

  const blogUrls: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || post.published_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Get all active products for sitemap (using slugs for SEO)
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('slug, updated_at, created_at')
    .eq('is_active', true)
    .not('slug', 'is', null) // Only include products with slugs
    .order('created_at', { ascending: false })

  const productUrls: MetadataRoute.Sitemap = (products || [])
    .filter((product) => product.slug) // Ensure slug exists
    .map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: new Date(
        product.updated_at || product.created_at || new Date()
      ),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  return [...staticPages, ...blogUrls, ...productUrls]
}
