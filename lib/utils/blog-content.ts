/**
 * Utilities for processing blog content HTML
 * Ensures images are properly formatted for static generation
 */

/**
 * Extract product IDs from blog content
 * Finds all product embed divs and extracts their IDs
 */
export function extractProductIds(html: string): string[] {
  if (!html) return []

  const productIdRegex =
    /<div[^>]*class\s*=\s*["']blog-product-embed["'][^>]*data-product-id\s*=\s*["']([^"']+)["'][^>]*>/gi
  const productIds: string[] = []
  let match

  while ((match = productIdRegex.exec(html)) !== null) {
    if (match[1]) {
      productIds.push(match[1])
    }
  }

  return [...new Set(productIds)] // Remove duplicates
}

/**
 * Add IDs to headings for table of contents navigation
 */
export function addHeadingIds(html: string): string {
  if (!html) return html

  let processed = html
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi

  processed = processed.replace(headingRegex, (match, level, content) => {
    const text = content.replace(/<[^>]*>/g, '').trim()
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check if heading already has an id
    if (match.includes('id=')) {
      return match
    }

    // Add id attribute
    return match.replace(/<h([1-6])/, `<h${level} id="${id}"`)
  })

  return processed
}

/**
 * Process blog content HTML to optimize images for static generation
 * - Converts ImageKit URLs to use Next.js Image component where possible
 * - Ensures all images have proper alt attributes
 * - Adds loading attributes for better performance
 * - Preserves product embeds for client-side rendering
 * - Adds IDs to headings for table of contents
 */
export function processBlogContent(html: string): string {
  if (!html) return html

  // Create a temporary DOM parser (works in Node.js with jsdom or browser)
  // For static generation, we'll use a simpler regex-based approach
  let processed = html

  // Add IDs to headings first
  processed = addHeadingIds(processed)

  // Ensure all images have proper attributes
  // Add loading="lazy" to images that don't have it
  processed = processed.replace(
    /<img([^>]*?)(?:\s+loading\s*=\s*["'][^"']*["'])?([^>]*?)>/gi,
    (match, before, after) => {
      // Check if loading attribute already exists
      if (match.includes('loading=')) {
        return match
      }
      // Add loading="lazy" if not the first image
      return `<img${before} loading="lazy"${after}>`
    }
  )

  // Ensure images have alt attributes
  processed = processed.replace(
    /<img([^>]*?)(?:\s+alt\s*=\s*["'][^"']*["'])?([^>]*?)>/gi,
    (match, before, after) => {
      if (match.includes('alt=')) {
        return match
      }
      return `<img${before} alt="Blog post image"${after}>`
    }
  )

  // Add width and height hints for ImageKit URLs (helps with layout shift)
  // ImageKit URLs can include transformation parameters
  processed = processed.replace(
    /<img([^>]*?)src\s*=\s*["']([^"']*imagekit[^"']*)["']([^>]*?)>/gi,
    (match, before, src, after) => {
      // If width/height already exist, don't modify
      if (match.includes('width=') && match.includes('height=')) {
        return match
      }
      // Add default dimensions for better CLS (Cumulative Layout Shift) score
      return `<img${before}src="${src}" width="800" height="600"${after}>`
    }
  )

  return processed
}

/**
 * Extract all image URLs from blog content HTML
 * Useful for preloading or generating image metadata
 */
export function extractImageUrls(html: string): string[] {
  if (!html) return []

  const imageUrlRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi
  const urls: string[] = []
  let match

  while ((match = imageUrlRegex.exec(html)) !== null) {
    if (match[1]) {
      urls.push(match[1])
    }
  }

  return urls
}

/**
 * Check if a URL is an ImageKit URL
 */
export function isImageKitUrl(url: string): boolean {
  return url.includes('imagekit.io') || url.includes('ik.imagekit.io')
}

/**
 * Generate optimized ImageKit URL with transformations
 * @param url - Original ImageKit URL
 * @param width - Desired width
 * @param height - Desired height
 * @param quality - Image quality (1-100)
 */
export function optimizeImageKitUrl(
  url: string,
  width?: number,
  height?: number,
  quality: number = 85
): string {
  if (!isImageKitUrl(url)) {
    return url
  }

  // ImageKit URL format: https://ik.imagekit.io/.../image.jpg?tr=w-800,h-600,q-85
  const urlObj = new URL(url)
  const params = new URLSearchParams(urlObj.search)

  if (width) {
    params.set('tr', `w-${width}${height ? `,h-${height}` : ''},q-${quality}`)
  } else if (quality !== 85) {
    params.set('tr', `q-${quality}`)
  }

  urlObj.search = params.toString()
  return urlObj.toString()
}

/**
 * Sanitize blog content HTML
 * Removes potentially dangerous scripts and ensures safe HTML
 */
export function sanitizeBlogContent(html: string): string {
  if (!html) return html

  // Remove script tags
  let sanitized = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  )

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '')

  return sanitized
}

/**
 * Extract clean text content from HTML for LLM processing
 * Preserves structure by converting headings and lists to text
 */
export function extractTextForLLM(html: string): string {
  if (!html) return ''

  let text = html

  // Convert headings to text with line breaks
  text = text.replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$2\n\n')

  // Convert paragraphs to text with line breaks
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')

  // Convert list items to text
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')

  // Convert line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n')

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]*>/g, '')

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
  text = text.replace(/[ \t]+/g, ' ') // Multiple spaces to single space
  text = text.trim()

  return text
}

/**
 * Extract structured content sections for LLM understanding
 * Returns an object with headings, paragraphs, and key information
 */
export function extractStructuredContent(html: string): {
  headings: string[]
  paragraphs: string[]
  lists: string[]
  text: string
} {
  if (!html) {
    return { headings: [], paragraphs: [], lists: [], text: '' }
  }

  const headings: string[] = []
  const headingMatches = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi)
  if (headingMatches) {
    headings.push(
      ...headingMatches.map((h) => h.replace(/<[^>]*>/g, '').trim())
    )
  }

  const paragraphs: string[] = []
  const paragraphMatches = html.match(/<p[^>]*>(.*?)<\/p>/gi)
  if (paragraphMatches) {
    paragraphs.push(
      ...paragraphMatches.map((p) => p.replace(/<[^>]*>/g, '').trim())
    )
  }

  const lists: string[] = []
  const listMatches = html.match(/<li[^>]*>(.*?)<\/li>/gi)
  if (listMatches) {
    lists.push(...listMatches.map((li) => li.replace(/<[^>]*>/g, '').trim()))
  }

  const text = extractTextForLLM(html)

  return { headings, paragraphs, lists, text }
}

/**
 * Convert blog HTML content to Markdown for parsers and LLMs.
 * Produces clean MD with headings, lists, links, and emphasis so content
 * can be fetched and understood without HTML noise.
 */
export function htmlToMarkdown(html: string): string {
  if (!html || typeof html !== 'string') return ''

  let md = html

  // Strip script and style
  md = md.replace(/<script[\s\S]*?<\/script>/gi, '')
  md = md.replace(/<style[\s\S]*?<\/style>/gi, '')

  // Block elements: add newlines so we don't glue lines
  md = md.replace(/<\/?(p|div|h[1-6]|li|tr|blockquote)[^>]*>/gi, '\n$&\n')

  // Headings: <h1>...</h1> -> # ..., etc.
  md = md.replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (_, level, inner) => {
    const prefix = '#'.repeat(parseInt(level, 10))
    const text = inner.replace(/<[^>]*>/g, '').trim()
    return `\n\n${prefix} ${text}\n\n`
  })

  // Links: <a href="...">text</a> -> [text](url)
  md = md.replace(
    /<a[^>]*href\s*=\s*["']([^"']*)["'][^>]*>(.*?)<\/a>/gi,
    (_, url, text) => {
      const t = text.replace(/<[^>]*>/g, '').trim()
      return `[${t}](${url})`
    }
  )

  // Strong/bold
  md = md.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**')

  // Em/italic
  md = md.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*')

  // Blockquote
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, (_, inner) => {
    const lines = inner
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(/\n/)
    return '\n\n' + lines.map((l) => '> ' + l.trim()).join('\n') + '\n\n'
  })

  // Unordered list: <ul>...</ul> with <li>...</li>
  md = md.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_, inner) => {
    const items = (inner.match(/<li[^>]*>(.*?)<\/li>/gi) || []).map((li) => {
      const t = li.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      return '- ' + t
    })
    return '\n\n' + items.join('\n') + '\n\n'
  })

  // Ordered list
  md = md.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_, inner) => {
    const items = (inner.match(/<li[^>]*>(.*?)<\/li>/gi) || []).map(
      (li, i) => {
        const t = li.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        return `${i + 1}. ${t}`
      }
    )
    return '\n\n' + items.join('\n') + '\n\n'
  })

  // Paragraphs: <p>...</p> -> content + double newline
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, (_, inner) => {
    const t = inner.replace(/<[^>]*>/g, '').trim()
    return t ? `${t}\n\n` : ''
  })

  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n')

  // Remove any remaining tags
  md = md.replace(/<[^>]*>/g, '')

  // Decode common entities
  md = md
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // Normalize whitespace
  md = md.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim()

  return md
}

/**
 * Build full Markdown document for a blog post with YAML frontmatter.
 * Links to the actual page via canonical URL so parsers/LLMs can associate
 * this content with the live blog URL for ranking and indexing.
 */
export function buildBlogMarkdownDocument(
  post: {
    title: string
    slug: string
    excerpt?: string | null
    content: string
    published_at?: string | null
    updated_at?: string | null
  },
  baseUrl: string
): string {
  const canonical = `${baseUrl}/blog/${post.slug}`
  const mdBody = htmlToMarkdown(post.content || '')

  const frontmatter: Record<string, string> = {
    title: post.title,
    canonical: canonical,
    url: canonical,
  }
  if (post.excerpt) frontmatter.excerpt = post.excerpt
  if (post.published_at) frontmatter.date = post.published_at
  if (post.updated_at) frontmatter.updated_at = post.updated_at

  const yamlLines = Object.entries(frontmatter)
    .map(([k, v]) => {
      const s = String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ')
      return `${k}: "${s}"`
    })
    .join('\n')

  return `---\n${yamlLines}\n---\n\n# ${post.title}\n\n${post.excerpt ? post.excerpt + '\n\n' : ''}${mdBody}`
}
