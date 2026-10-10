/**
 * Page metadata builder. Next.js merges metadata shallowly, so a page that
 * sets `openGraph` replaces the root layout's openGraph entirely — this helper
 * always emits the full set (canonical, hreflang, OG, Twitter, robots).
 */

import type { Metadata } from 'next'
import { SITE, absoluteUrl } from './site'

const INDEXABLE: Metadata['robots'] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
}

export interface PageSeo {
  /** Page title without the brand; the root layout template appends it. */
  title: string
  description: string
  /** Site-relative path, e.g. "/faq". Used for canonical + og:url. */
  path: string
  image?: string | null
  imageAlt?: string
  keywords?: string[]
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  section?: string
  tags?: string[]
  noIndex?: boolean
  /** Use the title verbatim (skip the "| heldeelife" template). */
  absoluteTitle?: boolean
}

export function clampDescription(text: string, max = 160): string {
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length)}…`
}

export function buildMetadata(seo: PageSeo): Metadata {
  const description = clampDescription(seo.description)
  const image = seo.image ? absoluteUrl(seo.image) : SITE.ogImage
  const images = [
    { url: image, width: 1200, height: 630, alt: seo.imageAlt || seo.title },
  ]

  return {
    title: seo.absoluteTitle ? { absolute: seo.title } : seo.title,
    description,
    keywords: seo.keywords?.length ? seo.keywords : undefined,
    alternates: {
      canonical: seo.path,
      languages: { 'en-IN': seo.path, 'x-default': seo.path },
    },
    openGraph: {
      type: seo.type || 'website',
      url: seo.path,
      siteName: SITE.name,
      locale: SITE.locale,
      title: seo.title,
      description,
      images,
      ...(seo.type === 'article' && {
        publishedTime: seo.publishedTime,
        modifiedTime: seo.modifiedTime,
        authors: seo.authors,
        section: seo.section,
        tags: seo.tags,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description,
      images: [image],
    },
    // Always set explicitly: a `robots: undefined` key would override the
    // root layout's directives with nothing.
    robots: seo.noIndex
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : INDEXABLE,
  }
}

/** For account, cart, checkout and other private/utility pages. */
export function privateMetadata(title: string, description?: string): Metadata {
  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
  }
}
