import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getInsightPost } from '@/lib/utils/insights-query'
import { InsightClient } from './insight-client'
import { getRelatedBlogPosts } from '@/lib/utils/blog-query'

export const dynamic = 'force-dynamic'
export const revalidate = 60

interface InsightPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: InsightPageProps): Promise<Metadata> {
  const { id } = await params
  const post = await getInsightPost(id)

  if (!post) {
    return {
      title: 'Insight Not Found | heldeelife',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'

  return {
    title: post.meta_title || `${post.title} | heldeelife`,
    description: post.meta_description || post.excerpt || post.title,
    keywords: post.meta_keywords || [],
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || '',
      type: 'article',
      url: `${baseUrl}/insights/${post.slug}`,
      images: post.featured_image
        ? [
            {
              url: post.featured_image,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : [],
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at,
      authors: ['heldeelife'],
      section: post.category?.name || 'Health & Wellness',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || '',
      images: post.featured_image ? [post.featured_image] : [],
    },
    alternates: {
      canonical: `${baseUrl}/insights/${post.slug}`,
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
}

export default async function InsightPage({ params }: InsightPageProps) {
  const { id } = await params
  const post = await getInsightPost(id)

  if (!post) {
    notFound()
  }

  // Get related posts
  const relatedPosts = await getRelatedBlogPosts(
    post.id,
    post.category_id || undefined,
    post.tags?.map((t: any) => t.id) || [],
    3
  )

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'

  // Structured data for the article
  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.featured_image || undefined,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Organization',
      name: 'heldeelife',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'heldeelife',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/insights/${post.slug}`,
    },
    articleSection: post.category?.name || 'Health & Wellness',
    keywords: post.meta_keywords || [],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }}
      />
      <InsightClient post={post} relatedPosts={relatedPosts} />
    </>
  )
}
