import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/site'

/**
 * Crawlers obey only the most specific matching group, so every group must
 * repeat the private paths — otherwise e.g. a Googlebot group would silently
 * re-allow /checkout and /profile.
 */
const PRIVATE_PATHS = [
  '/admin/',
  '/api/',
  '/auth/',
  '/cart',
  '/checkout',
  '/profile',
  '/orders',
  '/wishlist',
  '/compare',
  '/tracking',
  '/unsubscribe',
  '/unauthorized',
  '/offline',
  '/blog/preview/',
  '/search',
  '/*?*sort=',
]

/**
 * AI search / answer-engine crawlers (GEO). Allowing them lets heldeelife be
 * cited in ChatGPT search, Perplexity, Claude, Gemini, Copilot and Apple
 * Intelligence answers. Remove an entry to opt that vendor out.
 */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
  'CCBot',
  'Meta-ExternalAgent',
  'DuckAssistBot',
  'cohere-ai',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
      {
        userAgent: AI_CRAWLERS,
        allow: ['/', '/llms.txt'],
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
