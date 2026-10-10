import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/lib/seo/json-ld'
import { Suspense } from 'react'
import { getInsightsPosts } from '@/lib/utils/insights-query'
import { InsightsClient } from './insights-client'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = buildMetadata({
  title: 'Health Insights & Learning',
  description:
    'Expert health insights, wellness tips and educational guides on Ayurveda, modern medicine and holistic living from heldeelife.',
  path: '/insights',
})

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
      <JsonLd data={insightsStructuredData} />
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
