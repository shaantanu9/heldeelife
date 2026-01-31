import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getBlogPostOptimized,
  getBlogPostSlugs,
  getRelatedBlogPosts,
} from '@/lib/utils/blog-query'
import {
  processBlogContent,
  extractImageUrls,
  extractProductIds,
} from '@/lib/utils/blog-content'
import { getProducts } from '@/lib/api/server'
import { BlogContentWithProducts } from '@/components/blog/blog-content-with-products'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Eye, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { RelatedProductsSection } from '@/components/blog/related-products-section'
import { ReadingProgress } from '@/components/blog/reading-progress'
import { TableOfContents } from '@/components/blog/table-of-contents'
import { AuthorCard } from '@/components/blog/author-card'
import { ShareButtons } from '@/components/blog/share-buttons'
import { SidebarTrustSignals } from '@/components/blog/sidebar-trust-signals'
import dynamic from 'next/dynamic'

// Lazy load heavy components
const NewsletterLazy = dynamic(
  () =>
    import('@/components/sections/newsletter').then((mod) => ({
      default: mod.Newsletter,
    })),
  {
    ssr: true,
  }
)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostOptimized(slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  // Extract images from content for Open Graph
  const contentImages = extractImageUrls(post.content)
  const allImages = post.featured_image
    ? [post.featured_image, ...contentImages].slice(0, 4) // Limit to 4 images
    : contentImages.slice(0, 4)

  const baseUrlForMetadata =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'

  return {
    title: post.meta_title || post.title,
    description:
      post.meta_description || post.excerpt || 'Read our latest article',
    keywords: [
      ...(post.meta_keywords || []),
      ...(post.tags?.map((tag: any) => tag.name) || []),
      post.category?.name || '',
    ].filter(Boolean),
    authors: post.author?.name ? [{ name: post.author.name }] : undefined,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || '',
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at,
      authors: post.author?.name ? [post.author.name] : undefined,
      images: allImages.length > 0 ? allImages : [],
      url: `${baseUrlForMetadata}/blog/${post.slug}`,
      siteName: 'heldeelife',
      ...(post.category && {
        section: post.category.name,
      }),
      ...(post.tags &&
        post.tags.length > 0 && {
          tags: post.tags.map((tag: any) => tag.name),
        }),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || '',
      images: allImages.length > 0 ? allImages : [],
      creator: post.author?.name
        ? `@${post.author.name.replace(/\s+/g, '')}`
        : undefined,
    },
    alternates: {
      canonical: `${baseUrlForMetadata}/blog/${post.slug}`,
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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getBlogPostOptimized(slug)

  if (!post) {
    notFound()
  }

  // Get related posts for internal linking (important for LLMs)
  const relatedPosts = await getRelatedBlogPosts(
    post.id,
    post.category_id,
    post.tags?.map((tag: any) => tag.id) || [],
    3
  )

  // Extract product IDs from blog content and get suggested products
  const productIds = extractProductIds(post.content || '')
  const suggestedProducts = await getProducts({
    featured: true,
    limit: 6,
  })

  // Process content for static generation
  // Ensure content exists and is a string
  const postContent = post.content || ''
  const processedContent = processBlogContent(postContent)
  const contentImages = extractImageUrls(postContent)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'

  // Enhanced structured data for SEO and LLM-friendliness
  // Extract clean text content for LLMs (remove HTML tags, preserve structure)
  const textContent =
    post.content
      ?.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || ''
  const wordCount = textContent
    .split(/\s+/)
    .filter((word: string) => word.length > 0).length

  // Extract headings for better structure understanding
  const headings = post.content?.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) || []
  const headingTexts = headings
    .map((h: string) => h.replace(/<[^>]*>/g, '').trim())
    .filter(Boolean)

  // Extract first paragraph as abstract/summary
  const firstParagraph =
    textContent.split(/\n\n|\. /)[0]?.substring(0, 300) || post.excerpt || ''

  // Create comprehensive keywords array
  const allKeywords = [
    ...(post.meta_keywords || []),
    ...(post.tags?.map((tag: any) => tag.name) || []),
    ...(post.category ? [post.category.name] : []),
  ].filter(Boolean)

  // Enhanced BlogPosting schema (primary) - LLM optimized
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description || post.excerpt || firstParagraph,
    abstract: firstParagraph,
    articleBody: textContent, // Full text for LLMs
    text: textContent, // LLM-friendly text field (full content)
    image: post.featured_image
      ? [
          post.featured_image,
          ...contentImages.slice(0, 4), // Include more images for context
        ]
      : contentImages.slice(0, 4),
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.author?.name || post.author?.email || 'heldeelife',
      ...(post.author?.email && { email: post.author.email }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'heldeelife',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${post.slug}`,
      url: `${baseUrl}/blog/${post.slug}`,
    },
    articleSection: post.category?.name || 'Health & Wellness',
    keywords: allKeywords.join(', '),
    about: allKeywords.map((keyword) => ({
      '@type': 'Thing',
      name: keyword,
    })),
    mentions:
      post.tags?.map((tag: any) => ({
        '@type': 'Thing',
        name: tag.name,
      })) || [],
    wordCount: wordCount,
    timeRequired: post.reading_time ? `PT${post.reading_time}M` : undefined,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    url: `${baseUrl}/blog/${post.slug}`,
    ...(post.category && {
      articleSection: post.category.name,
      category: {
        '@type': 'Thing',
        name: post.category.name,
      },
    }),
    ...(headingTexts.length > 0 && {
      // Include headings for better structure understanding by LLMs
      hasPart: headingTexts
        .slice(0, 10)
        .map((heading: string, index: number) => ({
          '@type': 'CreativeWork',
          name: heading,
          position: index + 1,
        })),
    }),
  }

  // Article schema (dual schema for better LLM compatibility and search engines)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description || post.excerpt || firstParagraph,
    abstract: firstParagraph,
    articleBody: textContent,
    text: textContent,
    image: post.featured_image || contentImages[0] || undefined,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.author?.name || post.author?.email || 'heldeelife',
    },
    publisher: {
      '@type': 'Organization',
      name: 'heldeelife',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${post.slug}`,
    },
    articleSection: post.category?.name || 'Health & Wellness',
    keywords: allKeywords.join(', '),
    about: allKeywords.map((keyword) => ({
      '@type': 'Thing',
      name: keyword,
    })),
    wordCount: wordCount,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    url: `${baseUrl}/blog/${post.slug}`,
  }

  // Extract FAQ-like content from headings (questions in headings)
  const faqItems: Array<{ question: string; answer: string }> = []
  const questionPattern =
    /^(what|how|why|when|where|who|can|does|is|are|will|should|do|did)[\s\?]/i

  headingTexts.forEach((heading: string, index: number) => {
    if (questionPattern.test(heading)) {
      // Try to find answer in next paragraph or section
      const headingIndex = post.content?.indexOf(heading) || -1
      if (headingIndex > -1) {
        const afterHeading = post.content?.substring(
          headingIndex + heading.length
        )
        const nextHeadingMatch = afterHeading?.match(/<h[1-6][^>]*>/i)
        const answerEnd = nextHeadingMatch
          ? nextHeadingMatch.index
          : afterHeading?.length || 0
        const answerText =
          afterHeading
            ?.substring(0, answerEnd)
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 500) || firstParagraph

        if (answerText.length > 50) {
          faqItems.push({
            question: heading.replace(/\?+$/, '').trim(),
            answer: answerText,
          })
        }
      }
    }
  })

  // FAQ Schema (if questions detected in content)
  const faqSchema =
    faqItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        }
      : null

  // QAPage Schema (for better LLM understanding of Q&A content)
  const qaPageSchema =
    faqItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'QAPage',
          mainEntity: {
            '@type': 'Question',
            name: post.title,
            acceptedAnswer: {
              '@type': 'Answer',
              text: textContent.substring(0, 2000), // First 2000 chars as answer
            },
          },
        }
      : null

  // Enhanced Breadcrumb structured data
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: baseUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: `${baseUrl}/blog`,
    },
  ]

  // Add category if exists
  if (post.category) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbItems.length + 1,
      name: post.category.name,
      item: `${baseUrl}/blog?category=${post.category.slug}`,
    })
  }

  // Add current post
  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: post.title,
    item: `${baseUrl}/blog/${post.slug}`,
  })

  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  }

  return (
    <>
      {/* Primary BlogPosting Schema - Optimized for LLMs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Article Schema - Dual schema for maximum LLM and search engine compatibility */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {/* FAQ Schema - If questions detected in content */}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {/* QAPage Schema - For Q&A style content */}
      {qaPageSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(qaPageSchema) }}
        />
      )}
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />
      {/* Reading Progress Indicator - Zeigarnik Effect */}
      <ReadingProgress />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 overflow-x-hidden">
        {/* Main Content Container */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Main Article Content */}
            <article className="lg:col-span-8">
              <div className="max-w-3xl mx-auto">
                {/* Breadcrumb Navigation - Improved Alignment */}
                <div className="mb-6 sm:mb-8">
                  <Breadcrumb>
                    <BreadcrumbList className="items-center">
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          href="/"
                          className="text-gray-600 hover:text-orange-600 transition-colors"
                        >
                          Home
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="mx-1.5" />
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          href="/blog"
                          className="text-gray-600 hover:text-orange-600 transition-colors"
                        >
                          Blog
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {post.category && (
                        <>
                          <BreadcrumbSeparator className="mx-1.5" />
                          <BreadcrumbItem>
                            <BreadcrumbLink
                              href={`/blog?category=${post.category.slug}`}
                              className="text-gray-600 hover:text-orange-600 transition-colors"
                            >
                              {post.category.name}
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                        </>
                      )}
                      <BreadcrumbSeparator className="mx-1.5" />
                      <BreadcrumbItem className="max-w-[500px]">
                        <BreadcrumbPage className="text-gray-900 font-medium truncate">
                          {post.title}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>

                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-6 sm:mb-8 transition-colors text-sm sm:text-base"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Blog
                </Link>

                {post.category && (
                  <Link href={`/blog?category=${post.category.slug}`}>
                    <Badge
                      variant="secondary"
                      className="mb-4 sm:mb-6 hover:bg-orange-600 hover:text-white transition-colors cursor-pointer"
                    >
                      {post.category.name}
                    </Badge>
                  </Link>
                )}

                <header
                  className="mb-8 sm:mb-12"
                  itemScope
                  itemType="https://schema.org/WPHeader"
                >
                  <h1
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight tracking-tight text-gray-900"
                    itemProp="headline"
                  >
                    {post.title}
                  </h1>
                  {post.excerpt && (
                    <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 leading-relaxed font-light">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Meta Information with Social Proof */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm sm:text-base text-gray-600 border-b border-gray-200 pb-6 sm:pb-8">
                    {post.author?.name && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                          <span className="text-xs font-semibold text-orange-600">
                            {post.author.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {post.author.name}
                        </span>
                      </div>
                    )}
                    {post.published_at && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <time dateTime={post.published_at}>
                          {new Date(post.published_at).toLocaleDateString(
                            'en-US',
                            {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </time>
                      </div>
                    )}
                    {post.reading_time && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{post.reading_time} min read</span>
                      </div>
                    )}
                    {post.views_count > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-4 w-4" />
                        <span>{post.views_count.toLocaleString()} views</span>
                      </div>
                    )}
                  </div>

                  {/* Share Buttons - Above the fold */}
                  <div className="mb-6 sm:mb-8 pb-6 border-b border-gray-200">
                    <ShareButtons
                      url={`${baseUrl}/blog/${post.slug}`}
                      title={post.title}
                      description={post.excerpt || ''}
                    />
                  </div>
                </header>

                {post.featured_image && (
                  <div
                    className="relative w-full mb-8 sm:mb-12 rounded-xl overflow-hidden shadow-xl border-2 border-gray-100"
                    itemProp="image"
                    itemScope
                    itemType="https://schema.org/ImageObject"
                  >
                    <div className="relative w-full aspect-video sm:aspect-[21/9]">
                      <Image
                        src={post.featured_image}
                        alt={post.title || 'Blog post featured image'}
                        fill
                        className="object-cover"
                        priority
                        itemProp="url"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
                      />
                    </div>
                    <meta itemProp="width" content="1200" />
                    <meta itemProp="height" content="675" />
                  </div>
                )}

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8 sm:mb-12">
                    {post.tags.map((tag: any) => (
                      <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                        <Badge
                          variant="outline"
                          className="text-xs sm:text-sm hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-colors cursor-pointer"
                        >
                          {tag.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}

                {processedContent ? (
                  <section className="mb-12 sm:mb-16" itemProp="articleBody">
                    <BlogContentWithProducts content={processedContent} />
                  </section>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>No content available for this post.</p>
                  </div>
                )}

                {/* Share Section - Mid Content */}
                <div className="my-12 py-8 border-y border-gray-200 bg-white/50 rounded-lg px-6">
                  <div className="text-center mb-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Enjoyed this article?
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      Share it with others who might find it helpful!
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <ShareButtons
                      url={`${baseUrl}/blog/${post.slug}`}
                      title={post.title}
                      description={post.excerpt || ''}
                    />
                  </div>
                </div>

                <footer className="border-t border-gray-200 pt-8 sm:pt-12 mt-12 sm:mt-16">
                  {/* Category and Tags Section */}
                  {post.category && (
                    <div className="mb-6">
                      <h3 className="text-sm sm:text-base font-semibold mb-3 text-gray-900">
                        Category:
                      </h3>
                      <Link href={`/blog?category=${post.category.slug}`}>
                        <Badge
                          variant="secondary"
                          className="hover:bg-orange-600 hover:text-white transition-colors cursor-pointer"
                        >
                          {post.category.name}
                        </Badge>
                      </Link>
                    </div>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm sm:text-base font-semibold mb-3 text-gray-900">
                        Tags:
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag: any) => (
                          <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                            <Badge
                              variant="outline"
                              className="hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-colors cursor-pointer"
                            >
                              {tag.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Author Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-gray-200">
                    {post.author?.name && (
                      <div className="text-sm text-gray-600">
                        <p>
                          Written by{' '}
                          <span className="font-semibold text-gray-900">
                            {post.author.name}
                          </span>
                        </p>
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      Last updated:{' '}
                      {new Date(post.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </footer>

                {/* Related Posts Section - Important for LLM understanding of content relationships */}
                {relatedPosts.length > 0 && (
                  <section className="mt-12 sm:mt-16 pt-12 sm:pt-16 border-t border-gray-200">
                    <div className="mb-6 sm:mb-8">
                      <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">
                        Related Articles
                      </h2>
                      <p className="text-gray-600">
                        Continue reading with these related articles
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                      {relatedPosts.map((relatedPost: any) => (
                        <Link
                          key={relatedPost.id}
                          href={`/blog/${relatedPost.slug}`}
                          className="group block"
                        >
                          <article className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 bg-white">
                            {relatedPost.featured_image && (
                              <div className="relative w-full h-40 sm:h-48">
                                <Image
                                  src={relatedPost.featured_image}
                                  alt={relatedPost.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                />
                              </div>
                            )}
                            <div className="p-4 sm:p-6">
                              {relatedPost.category && (
                                <Badge
                                  variant="secondary"
                                  className="mb-2 sm:mb-3 text-xs"
                                >
                                  {relatedPost.category.name}
                                </Badge>
                              )}
                              <h3 className="font-semibold text-base sm:text-lg mb-2 group-hover:text-orange-600 transition-colors line-clamp-2 text-gray-900">
                                {relatedPost.title}
                              </h3>
                              {relatedPost.excerpt && (
                                <p className="text-sm sm:text-base text-gray-600 line-clamp-2 leading-relaxed">
                                  {relatedPost.excerpt}
                                </p>
                              )}
                            </div>
                          </article>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Related Products Section */}
                {suggestedProducts.length > 0 && (
                  <RelatedProductsSection
                    products={suggestedProducts}
                    title="Shop Related Products"
                    description="Discover products related to this article"
                  />
                )}
              </div>
            </article>

            {/* Sidebar - Table of Contents, Author & Trust Signals */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-6 pt-8 lg:pt-0">
                <TableOfContents content={processedContent || postContent} />
                <AuthorCard
                  author={post.author}
                  readingTime={post.reading_time}
                  viewsCount={post.views_count}
                />
                <SidebarTrustSignals />
              </div>
            </aside>
          </div>
        </div>

        {/* Newsletter Section - Lead Capture (Reciprocity Principle) */}
        <NewsletterLazy />
      </div>
    </>
  )
}

// ISR: Revalidate every 60 seconds for updated content
export const revalidate = 60

// Generate static params for all published posts (ISR)
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const slugs = await getBlogPostSlugs()
    return slugs.map((slug) => ({ slug }))
  } catch (error) {
    console.error('Error generating static params:', error)
    // Return empty array to prevent build failure
    return []
  }
}
