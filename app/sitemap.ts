import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/seo/site'

export const revalidate = 3600 // Revalidate sitemap every hour

type Entry = MetadataRoute.Sitemap[number]

const STATIC_PAGES: Array<{
  path: string
  changeFrequency: Entry['changeFrequency']
  priority: number
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/shop', changeFrequency: 'daily', priority: 0.9 },
  { path: '/blog', changeFrequency: 'daily', priority: 0.8 },
  { path: '/insights', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/service', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/help', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/shipping', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/refund', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/cookie', changeFrequency: 'yearly', priority: 0.2 },
]

const isHttpUrl = (v: unknown): v is string =>
  typeof v === 'string' && /^https?:\/\//.test(v)

const toDate = (...values: Array<string | null | undefined>) => {
  const v = values.find(Boolean)
  return v ? new Date(v) : undefined
}

async function productEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('slug, image, images, updated_at, created_at')
      .eq('is_active', true)
      .not('slug', 'is', null)
      .order('created_at', { ascending: false })
    if (error) throw error

    return (data || []).map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: toDate(p.updated_at, p.created_at),
      changeFrequency: 'weekly',
      priority: 0.8,
      images: [p.image, ...(p.images || [])].filter(isHttpUrl).slice(0, 10),
    }))
  } catch (error) {
    console.error('[sitemap] products unavailable:', error)
    return []
  }
}

async function blogEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select('slug, featured_image, updated_at, published_at')
      .eq('status', 'published')
      .not('slug', 'is', null)
      .order('published_at', { ascending: false })
    if (error) throw error

    // Insights render the same posts; /insights/* canonicalises to /blog/*,
    // so only the canonical URL is listed here.
    return (data || []).map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: toDate(post.updated_at, post.published_at),
      changeFrequency: 'monthly',
      priority: 0.7,
      images: isHttpUrl(post.featured_image) ? [post.featured_image] : [],
    }))
  } catch (error) {
    console.error('[sitemap] blog posts unavailable:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts] = await Promise.all([productEntries(), blogEntries()])

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: `${SITE_URL}${page.path === '/' ? '' : page.path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))

  return [...staticEntries, ...products, ...posts]
}
