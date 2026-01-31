/**
 * Structured Data (JSON-LD) Utilities
 * Generates schema.org structured data for SEO and LLM-friendly content
 */

import { APP_CONFIG } from '@/lib/constants'

export interface ProductStructuredData {
  name: string
  description: string
  image: string | string[]
  sku?: string
  price: number
  currency?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
  brand?: string
  rating?: {
    value: number
    count: number
  }
  url?: string
}

export interface OrderStructuredData {
  orderNumber: string
  orderDate: string
  orderStatus: string
  totalPrice: number
  currency?: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

export interface BlogPostStructuredData {
  title: string
  description: string
  image?: string
  author: string
  datePublished: string
  dateModified?: string
  url: string
  category?: string
}

/**
 * Generate Product structured data
 */
export function generateProductStructuredData(
  product: ProductStructuredData
): object {
  const baseUrl = APP_CONFIG.url
  const images = Array.isArray(product.image) ? product.image : [product.image]

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: images,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand || APP_CONFIG.name,
    },
    offers: {
      '@type': 'Offer',
      url: product.url || `${baseUrl}/products/${product.sku || ''}`,
      priceCurrency: product.currency || 'INR',
      price: product.price.toString(),
      availability:
        product.availability === 'InStock'
          ? 'https://schema.org/InStock'
          : product.availability === 'OutOfStock'
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/PreOrder',
      seller: {
        '@type': 'Organization',
        name: APP_CONFIG.name,
      },
    },
    ...(product.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating.value.toString(),
        reviewCount: product.rating.count.toString(),
      },
    }),
  }
}

/**
 * Generate Order structured data
 */
export function generateOrderStructuredData(
  order: OrderStructuredData
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Order',
    orderNumber: order.orderNumber,
    orderDate: order.orderDate,
    orderStatus: `https://schema.org/OrderStatus/${order.orderStatus}`,
    totalPrice: {
      '@type': 'PriceSpecification',
      price: order.totalPrice.toString(),
      priceCurrency: order.currency || 'INR',
    },
    orderedItem: order.items.map((item) => ({
      '@type': 'OrderItem',
      name: item.name,
      quantity: item.quantity,
      price: item.price.toString(),
    })),
  }
}

/**
 * Generate Blog Post structured data
 */
export function generateBlogPostStructuredData(
  post: BlogPostStructuredData
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.image,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: APP_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${APP_CONFIG.url}/logo.png`,
      },
    },
    datePublished: post.datePublished,
    dateModified: post.dateModified || post.datePublished,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.url,
    },
    ...(post.category && {
      articleSection: post.category,
    }),
  }
}

/**
 * Generate Breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationStructuredData(
  additionalData?: Record<string, unknown>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_CONFIG.name,
    url: APP_CONFIG.url,
    logo: `${APP_CONFIG.url}/logo.png`,
    description: APP_CONFIG.description,
    ...additionalData,
  }
}

/**
 * Generate WebSite structured data with search action
 */
export function generateWebSiteStructuredData(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: APP_CONFIG.name,
    url: APP_CONFIG.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${APP_CONFIG.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * Generate FAQ structured data
 */
export function generateFAQStructuredData(
  faqs: Array<{ question: string; answer: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Render structured data as JSON-LD script tag
 */
export function renderStructuredData(data: object): string {
  return JSON.stringify(data, null, 0)
}









