/**
 * Slug generation and validation utilities
 * Used for products, blog posts, categories, and other URL-friendly identifiers
 */

/**
 * Generate a URL-friendly slug from a string
 * Converts text to lowercase, removes special characters, and replaces spaces with hyphens
 */
export function generateSlug(text: string): string {
  if (!text) return ''

  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Validate if a slug is properly formatted
 * Slugs should be lowercase, contain only alphanumeric characters and hyphens
 */
export function isValidSlug(slug: string): boolean {
  if (!slug) return false

  // Slug should be lowercase, alphanumeric with hyphens, no spaces
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 100
}

/**
 * Ensure slug uniqueness by appending a number if needed
 * This is a helper for generating unique slugs (actual uniqueness should be checked in database)
 */
export function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug
  }

  let counter = 1
  let uniqueSlug = `${baseSlug}-${counter}`

  while (existingSlugs.includes(uniqueSlug)) {
    counter++
    uniqueSlug = `${baseSlug}-${counter}`
  }

  return uniqueSlug
}









