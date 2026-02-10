import { describe, it, expect } from 'vitest'
import {
  generateSlug,
  generateKeywords,
  extractExcerpt,
  calculateReadingTime,
} from '@/lib/utils/blog'

describe('blog utils', () => {
  describe('generateSlug', () => {
    it('converts title to lowercase slug', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
    })

    it('replaces spaces with hyphens', () => {
      expect(generateSlug('My Blog Post Title')).toBe('my-blog-post-title')
    })

    it('removes special characters', () => {
      expect(generateSlug('Hello! What\'s Up?')).toBe('hello-whats-up')
    })

    it('trims leading and trailing hyphens', () => {
      expect(generateSlug('  Hello World  ')).toBe('hello-world')
      expect(generateSlug('---Hello---')).toBe('hello')
    })

    it('collapses multiple spaces or hyphens to single hyphen', () => {
      expect(generateSlug('Hello    World')).toBe('hello-world')
      expect(generateSlug('Hello---World')).toBe('hello-world')
    })

    it('handles empty string', () => {
      expect(generateSlug('')).toBe('')
    })

    it('handles unicode and numbers', () => {
      expect(generateSlug('Post 123')).toBe('post-123')
    })
  })

  describe('generateKeywords', () => {
    it('extracts keywords from title and content', () => {
      const keywords = generateKeywords(
        'Healthy Living Tips',
        'Healthy living is important for wellness. Tips include exercise and diet.'
      )
      expect(keywords).toContain('healthy')
      expect(keywords).toContain('living')
      expect(keywords).toContain('tips')
      expect(keywords.length).toBeLessThanOrEqual(10)
    })

    it('excludes stop words', () => {
      const keywords = generateKeywords('The Best Way to Do It', 'This is the way')
      expect(keywords).not.toContain('the')
      expect(keywords).not.toContain('to')
      expect(keywords).not.toContain('is')
    })

    it('returns at most maxKeywords', () => {
      const longContent = Array(20)
        .fill('keyword unique word term')
        .join(' ')
      const keywords = generateKeywords('Title', longContent, 5)
      expect(keywords.length).toBeLessThanOrEqual(5)
    })

    it('sorts by frequency (most frequent first)', () => {
      const keywords = generateKeywords(
        'Wellness',
        'Wellness wellness wellness health health diet'
      )
      expect(keywords[0]).toBe('wellness')
    })

    it('returns empty array for empty title and content', () => {
      const keywords = generateKeywords('', '')
      expect(keywords).toEqual([])
    })
  })

  describe('extractExcerpt', () => {
    it('returns content as-is when shorter than maxLength', () => {
      const content = 'Short text.'
      expect(extractExcerpt(content, 160)).toBe('Short text.')
    })

    it('truncates to maxLength when no sentence boundary', () => {
      const content = 'A'.repeat(200)
      const result = extractExcerpt(content, 100)
      expect(result.length).toBeLessThanOrEqual(103)
      expect(result).toContain('...')
    })

    it('truncates at sentence boundary when possible', () => {
      const content = 'First sentence. Second sentence. Third sentence.'
      const result = extractExcerpt(content, 25)
      expect(result).toMatch(/^First sentence\./)
    })

    it('strips HTML tags', () => {
      const content = '<p>Hello <strong>world</strong>.</p>'
      expect(extractExcerpt(content, 160)).toBe('Hello world.')
    })

    it('uses default maxLength of 160', () => {
      const content = 'A'.repeat(200)
      expect(extractExcerpt(content).length).toBeLessThanOrEqual(163)
    })
  })

  describe('calculateReadingTime', () => {
    it('calculates reading time from word count', () => {
      const content = Array(200).fill('word').join(' ')
      expect(calculateReadingTime(content)).toBe(1)
    })

    it('rounds up partial minutes', () => {
      const content = Array(250).fill('word').join(' ')
      expect(calculateReadingTime(content)).toBe(2)
    })

    it('returns 1 for very short content', () => {
      expect(calculateReadingTime('Hi')).toBe(1)
    })

    it('returns 0 or 1 for empty content (implementation-defined)', () => {
      const result = calculateReadingTime('')
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(1)
    })
  })
})
