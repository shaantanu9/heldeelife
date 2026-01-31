/**
 * Readability Analysis Utilities
 * Calculates reading ease, reading time, and provides suggestions
 */

export interface ReadabilityMetrics {
  wordCount: number
  characterCount: number
  sentenceCount: number
  paragraphCount: number
  averageWordsPerSentence: number
  averageCharactersPerWord: number
  fleschReadingEase: number
  readingTime: number // in minutes
  readingLevel: string
  suggestions: string[]
}

/**
 * Extract plain text from HTML
 */
function extractText(html: string): string {
  if (!html) return ''
  
  // Remove script and style elements
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim()

  return text
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  if (!text) return 0
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length
}

/**
 * Count sentences in text
 */
function countSentences(text: string): number {
  if (!text) return 0
  // Split by sentence-ending punctuation
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  return sentences.length || 1 // At least 1 sentence
}

/**
 * Count paragraphs in HTML
 */
function countParagraphs(html: string): number {
  if (!html) return 0
  const matches = html.match(/<p[^>]*>/gi)
  return matches ? matches.length : 1
}

/**
 * Calculate Flesch Reading Ease Score
 * Score ranges from 0-100:
 * 90-100: Very Easy
 * 80-89: Easy
 * 70-79: Fairly Easy
 * 60-69: Standard
 * 50-59: Fairly Difficult
 * 30-49: Difficult
 * 0-29: Very Difficult
 */
function calculateFleschReadingEase(
  words: number,
  sentences: number,
  syllables: number
): number {
  if (words === 0 || sentences === 0) return 0

  const avgSentenceLength = words / sentences
  const avgSyllablesPerWord = syllables / words

  const score =
    206.835 -
    1.015 * avgSentenceLength -
    84.6 * avgSyllablesPerWord

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Estimate syllables in a word (simplified)
 */
function estimateSyllables(word: string): number {
  word = word.toLowerCase()
  if (word.length <= 3) return 1

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')
  const matches = word.match(/[aeiouy]{1,2}/g)
  return matches ? Math.max(1, matches.length) : 1
}

/**
 * Count total syllables in text
 */
function countSyllables(text: string): number {
  const words = text.trim().split(/\s+/)
  return words.reduce((sum, word) => sum + estimateSyllables(word), 0)
}

/**
 * Get reading level from Flesch score
 */
function getReadingLevel(score: number): string {
  if (score >= 90) return 'Very Easy'
  if (score >= 80) return 'Easy'
  if (score >= 70) return 'Fairly Easy'
  if (score >= 60) return 'Standard'
  if (score >= 50) return 'Fairly Difficult'
  if (score >= 30) return 'Difficult'
  return 'Very Difficult'
}

/**
 * Calculate reading time (average reading speed: 200 words per minute)
 */
function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 200
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

/**
 * Generate readability suggestions
 */
function generateSuggestions(metrics: ReadabilityMetrics): string[] {
  const suggestions: string[] = []

  if (metrics.wordCount < 300) {
    suggestions.push('Content is too short. Aim for at least 300 words for better SEO.')
  } else if (metrics.wordCount > 3000) {
    suggestions.push('Content is very long. Consider breaking it into multiple posts or sections.')
  }

  if (metrics.averageWordsPerSentence > 20) {
    suggestions.push('Some sentences are too long. Try breaking them into shorter sentences for better readability.')
  }

  if (metrics.fleschReadingEase < 60) {
    suggestions.push('Content may be difficult to read. Try using simpler words and shorter sentences.')
  }

  if (metrics.paragraphCount < 3) {
    suggestions.push('Add more paragraphs to break up the content and improve readability.')
  }

  if (metrics.sentenceCount < 5) {
    suggestions.push('Content needs more sentences. Expand your ideas with more detail.')
  }

  return suggestions
}

/**
 * Analyze readability of HTML content
 */
export function analyzeReadability(html: string): ReadabilityMetrics {
  const text = extractText(html)
  const wordCount = countWords(text)
  const characterCount = text.length
  const sentenceCount = countSentences(text)
  const paragraphCount = countParagraphs(html)
  const syllables = countSyllables(text)

  const averageWordsPerSentence =
    sentenceCount > 0 ? wordCount / sentenceCount : 0
  const averageCharactersPerWord =
    wordCount > 0 ? characterCount / wordCount : 0

  const fleschReadingEase = calculateFleschReadingEase(
    wordCount,
    sentenceCount,
    syllables
  )

  const readingTime = calculateReadingTime(wordCount)
  const readingLevel = getReadingLevel(fleschReadingEase)

  const metrics: ReadabilityMetrics = {
    wordCount,
    characterCount,
    sentenceCount,
    paragraphCount,
    averageWordsPerSentence,
    averageCharactersPerWord,
    fleschReadingEase,
    readingTime,
    readingLevel,
    suggestions: [],
  }

  metrics.suggestions = generateSuggestions(metrics)

  return metrics
}






