import { BlogPost } from '@/lib/types/blog'

/**
 * Calculate reading time in minutes based on content length
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Calculate SEO score for a blog post
 */
export function calculateSEOScore(post: BlogPost): number {
  let score = 0

  // Title (0-25 points)
  if (post.title && post.title.length >= 30 && post.title.length <= 60) {
    score += 25
  } else if (post.title && post.title.length > 0) {
    score += 15
  }

  // Meta description (0-25 points)
  if (
    post.meta_description &&
    post.meta_description.length >= 120 &&
    post.meta_description.length <= 160
  ) {
    score += 25
  } else if (post.meta_description && post.meta_description.length > 0) {
    score += 15
  }

  // Content length (0-20 points)
  if (post.content && post.content.length >= 1000) {
    score += 20
  } else if (post.content && post.content.length >= 500) {
    score += 10
  }

  // Featured image (0-10 points)
  if (post.featured_image) {
    score += 10
  }

  // Keywords (0-10 points)
  if (post.meta_keywords && post.meta_keywords.length >= 3) {
    score += 10
  } else if (post.meta_keywords && post.meta_keywords.length > 0) {
    score += 5
  }

  // Excerpt (0-10 points)
  if (post.excerpt && post.excerpt.length >= 100) {
    score += 10
  } else if (post.excerpt && post.excerpt.length > 0) {
    score += 5
  }

  return Math.min(score, 100)
}

/**
 * Extract excerpt from content if not provided
 */
export function extractExcerpt(
  content: string,
  maxLength: number = 160
): string {
  // Remove HTML tags if present
  const text = content.replace(/<[^>]*>/g, '').trim()

  if (text.length <= maxLength) {
    return text
  }

  // Find the last complete sentence within maxLength
  const truncated = text.substring(0, maxLength)
  const lastPeriod = truncated.lastIndexOf('.')
  const lastExclamation = truncated.lastIndexOf('!')
  const lastQuestion = truncated.lastIndexOf('?')
  const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion)

  if (lastSentenceEnd > maxLength * 0.5) {
    return truncated.substring(0, lastSentenceEnd + 1)
  }

  return truncated + '...'
}

/**
 * Generate meta keywords from title and content
 */
export function generateKeywords(
  title: string,
  content: string,
  maxKeywords: number = 10
): string[] {
  // Combine title and content
  const text = `${title} ${content}`.toLowerCase()

  // Common stop words to exclude
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'as',
    'is',
    'was',
    'are',
    'were',
    'been',
    'be',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'should',
    'could',
    'may',
    'might',
    'must',
    'can',
    'this',
    'that',
    'these',
    'those',
    'i',
    'you',
    'he',
    'she',
    'it',
    'we',
    'they',
    'what',
    'which',
    'who',
    'when',
    'where',
    'why',
    'how',
    'all',
    'each',
    'every',
    'both',
    'few',
    'more',
    'most',
    'other',
    'some',
    'such',
    'no',
    'nor',
    'not',
    'only',
    'own',
    'same',
    'so',
    'than',
    'too',
    'very',
    'just',
    'now',
  ])

  // Extract words
  const words = text.match(/\b[a-z]{3,}\b/g) || []

  // Count word frequency
  const wordCount = new Map<string, number>()
  words.forEach((word) => {
    if (!stopWords.has(word)) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    }
  })

  // Sort by frequency and return top keywords
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)
}
