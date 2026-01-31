import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getInsightsPosts } from '@/lib/utils/insights-query'
import { InsightsClient } from './insights-client'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Health Insights & Learning | heldeelife',
  description:
    'Discover expert health insights, wellness tips, and educational content about Ayurveda, modern medicine, and holistic wellness. Learn how to improve your health naturally.',
  keywords: [
    'health insights',
    'wellness tips',
    'ayurveda learning',
    'health education',
    'wellness guides',
    'health articles',
    'natural health',
    'holistic wellness',
  ],
  openGraph: {
    title: 'Health Insights & Learning | heldeelife',
    description:
      'Expert health insights, wellness tips, and educational content to support your wellness journey.',
    type: 'website',
    url: '/insights',
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'}/insights`,
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

// Revalidate every 60 seconds for new insights
export const revalidate = 60

// Loading component
function InsightsLoading() {
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

async function InsightsContent() {
  const posts = await getInsightsPosts(50)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'

  // Structured data for Insights collection
  const insightsStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Health Insights & Learning',
    description:
      'Expert health insights, wellness tips, and educational content about Ayurveda and modern medicine',
    url: `${baseUrl}/insights`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts.map((post: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Article',
          headline: post.title,
          description: post.excerpt || '',
          url: `${baseUrl}/insights/${post.slug}`,
          datePublished: post.published_at || post.created_at,
          image: post.featured_image || undefined,
          articleSection: post.category?.name || 'Health & Wellness',
        },
      })),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(insightsStructuredData) }}
      />
      <InsightsClient posts={posts} />
    </>
  )
}

export default async function InsightsPage() {
  return (
    <Suspense fallback={<InsightsLoading />}>
      <InsightsContent />
    </Suspense>
  )
}
