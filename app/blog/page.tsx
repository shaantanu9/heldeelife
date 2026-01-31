import type { Metadata } from 'next'
import { Suspense } from 'react'
import {
  getBlogPostsOptimized,
  getBlogCategories,
  getBlogTags,
} from '@/lib/utils/blog-query'
import { BlogClient } from './blog-client'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog - heldeelife | Health & Wellness Articles',
  description:
    'Discover expert insights on Ayurveda, modern medicine, health, and wellness. Read our latest articles and guides.',
  keywords: [
    'health blog',
    'ayurveda',
    'wellness',
    'medicine',
    'health articles',
  ],
  openGraph: {
    title: 'Blog - heldeelife',
    description:
      'Discover expert insights on Ayurveda, modern medicine, health, and wellness.',
    type: 'website',
    url: '/blog',
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'}/blog`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

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
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'heldeelife Blog',
    description:
      'Expert insights on health, wellness, Ayurveda, and modern medicine',
    url: `${baseUrl}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'heldeelife',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    blogPost: posts.map((post: any) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt || '',
      url: `${baseUrl}/blog/${post.slug}`,
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at,
      image: post.featured_image || undefined,
      author: {
        '@type': 'Person',
        name: 'heldeelife',
      },
      articleSection: post.category?.name || 'Health & Wellness',
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogStructuredData) }}
      />
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
