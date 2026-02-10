/**
 * SEO Utilities
 * Comprehensive SEO metadata generation and optimization
 */

import { Metadata } from 'next'
import { APP_CONFIG } from '@/lib/constants'

export interface SEOOptions {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product' | 'profile'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  noindex?: boolean
  nofollow?: boolean
  canonical?: string
}

/**
 * Generate comprehensive SEO metadata
 */
export function generateMetadata(options: SEOOptions): Metadata {
  const {
    title,
    description,
    keywords = [],
    image,
    url,
    type = 'website',
    author,
    publishedTime,
    modifiedTime,
    noindex = false,
    nofollow = false,
    canonical,
  } = options

  const baseUrl = APP_CONFIG.url
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl
  const imageUrl = image
    ? image.startsWith('http')
      ? image
      : `${baseUrl}${image}`
    : `${baseUrl}/og-image.jpg`

  const metadata: Metadata = {
    title: {
      default: title,
      template: `%s | ${APP_CONFIG.name}`,
    },
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: author ? [{ name: author }] : undefined,
    creator: APP_CONFIG.name,
    publisher: APP_CONFIG.name,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: canonical || fullUrl,
    },
    openGraph: {
      type:
        type === 'article'
          ? 'article'
          : 'website',
      locale: 'en_US',
      url: fullUrl,
      siteName: APP_CONFIG.name,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(type === 'article' && {
        authors: author ? [author] : undefined,
        publishedTime,
        modifiedTime,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: `@${APP_CONFIG.name.toLowerCase().replace(/\s+/g, '')}`,
    },
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }

  return metadata
}

/**
 * Generate product-specific SEO metadata
 */
export function generateProductMetadata(product: {
  name: string
  description: string
  image?: string
  slug: string
  price?: number
  category?: string
  keywords?: string[]
}): Metadata {
  return generateMetadata({
    title: product.name,
    description: product.description,
    keywords: [
      product.name,
      ...(product.category ? [product.category] : []),
      ...(product.keywords || []),
      'buy',
      'online',
      'ecommerce',
    ],
    image: product.image,
    url: `/products/${product.slug}`,
    type: 'product',
  })
}

/**
 * Generate blog post SEO metadata
 */
export function generateBlogMetadata(post: {
  title: string
  excerpt: string
  featuredImage?: string
  slug: string
  author?: string
  publishedAt?: string
  updatedAt?: string
  category?: string
  tags?: string[]
}): Metadata {
  return generateMetadata({
    title: post.title,
    description: post.excerpt,
    keywords: [
      ...(post.category ? [post.category] : []),
      ...(post.tags || []),
      'blog',
      'article',
    ],
    image: post.featuredImage,
    url: `/blog/${post.slug}`,
    type: 'article',
    author: post.author,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
  })
}

/**
 * Generate page title with site name
 */
export function generatePageTitle(pageTitle: string): string {
  return `${pageTitle} | ${APP_CONFIG.name}`
}

/**
 * Generate meta description (truncated to 160 chars)
 */
export function generateMetaDescription(
  description: string,
  maxLength = 160
): string {
  if (description.length <= maxLength) {
    return description
  }
  return description.substring(0, maxLength - 3) + '...'
}

/**
 * Generate keywords string from array
 */
export function generateKeywordsString(keywords: string[]): string {
  return keywords.join(', ')
}

/**
 * Validate SEO metadata
 */
export function validateSEO(options: SEOOptions): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!options.title || options.title.length < 10) {
    errors.push('Title should be at least 10 characters')
  }
  if (options.title && options.title.length > 60) {
    errors.push('Title should be less than 60 characters')
  }

  if (!options.description || options.description.length < 50) {
    errors.push('Description should be at least 50 characters')
  }
  if (options.description && options.description.length > 160) {
    errors.push('Description should be less than 160 characters')
  }

  if (options.keywords && options.keywords.length > 10) {
    errors.push('Keywords should be limited to 10 items')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
