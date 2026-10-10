import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/lib/seo/json-ld'
import { SCHEMA_IDS } from '@/lib/seo/site'
import { Suspense } from 'react'
import {
  getBlogPostsOptimized,
  getBlogCategories,
  getBlogTags,
} from '@/lib/utils/blog-query'
import { BlogClient } from './blog-client'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = buildMetadata({
  title: 'Ayurveda & Wellness Blog — Health Articles and Guides',
  description:
    'Expert articles on Ayurveda, immunity, respiratory health, natural remedies and modern medicine from the heldeelife team.',
  path: '/blog',
  keywords: [
    'ayurveda blog',
    'health articles',
    'natural remedies',
    'wellness tips',
  ],
})

// Revalidate every 60 seconds for new posts
export const revalidate = 60

// Loading component
function BlogLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </div>
    </div>
  )
}

async function BlogContent({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string; search?: string }>
}) {
  const params = await searchParams
  const category = params.category || undefined
  const tag = params.tag || undefined

  // Fetch data on the server with Next.js caching
  const [posts, categories, tags] = await Promise.all([
    getBlogPostsOptimized(50, 0, { category, tag }),
    getBlogCategories(),
    getBlogTags(),
  ])

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'

  // Structured data for Blog collection
  const blogStructuredData = {
    '@type': 'Blog',
    '@id': `${baseUrl}/blog#blog`,
    name: 'heldeelife Blog',
    description:
      'Expert insights on health, wellness, Ayurveda, and modern medicine',
    url: `${baseUrl}/blog`,
    publisher: { '@id': SCHEMA_IDS.organization },
    inLanguage: 'en-IN',
    blogPost: posts.map((post: any) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt || '',
      url: `${baseUrl}/blog/${post.slug}`,
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at,
      image: post.featured_image || undefined,
      author: { '@type': 'Person', name: post.author?.name || 'heldeelife' },
      articleSection: post.category?.name || 'Health & Wellness',
    })),
  }

  return (
    <>
      <JsonLd data={blogStructuredData} />
      <BlogClient posts={posts} categories={categories} tags={tags} />
    </>
  )
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string; search?: string }>
}) {
  return (
    <Suspense fallback={<BlogLoading />}>
      <BlogContent searchParams={searchParams} />
    </Suspense>
  )
}
