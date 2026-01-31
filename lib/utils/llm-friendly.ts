/**
 * LLM-Friendly Content Utilities
 * Optimize content structure for AI systems and LLMs
 */

export interface ContentStructure {
  title: string
  headings: Array<{ level: number; text: string; id?: string }>
  sections: Array<{ title: string; content: string; keyPoints?: string[] }>
  summary?: string
  metadata?: Record<string, unknown>
}

/**
 * Extract key points from content
 */
export function extractKeyPoints(content: string, maxPoints = 5): string[] {
  // Simple extraction: look for bullet points, numbered lists, or short sentences
  const lines = content.split('\n').map((line) => line.trim())
  const keyPoints: string[] = []

  for (const line of lines) {
    // Match bullet points (-, *, •)
    if (/^[-*•]\s+(.+)$/.test(line)) {
      const match = line.match(/^[-*•]\s+(.+)$/)
      if (match && match[1].length < 200) {
        keyPoints.push(match[1])
      }
    }
    // Match numbered lists
    else if (/^\d+\.\s+(.+)$/.test(line)) {
      const match = line.match(/^\d+\.\s+(.+)$/)
      if (match && match[1].length < 200) {
        keyPoints.push(match[1])
      }
    }
    // Match short sentences (potential key points)
    else if (line.length > 20 && line.length < 150 && line.endsWith('.')) {
      keyPoints.push(line)
    }

    if (keyPoints.length >= maxPoints) break
  }

  return keyPoints.slice(0, maxPoints)
}

/**
 * Generate content summary
 */
export function generateSummary(content: string, maxLength = 200): string {
  // Remove HTML tags if present
  const textContent = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (textContent.length <= maxLength) {
    return textContent
  }

  // Try to cut at sentence boundary
  const truncated = textContent.substring(0, maxLength)
  const lastPeriod = truncated.lastIndexOf('.')
  const lastExclamation = truncated.lastIndexOf('!')
  const lastQuestion = truncated.lastIndexOf('?')

  const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion)

  if (lastSentenceEnd > maxLength * 0.7) {
    return truncated.substring(0, lastSentenceEnd + 1)
  }

  return truncated + '...'
}

/**
 * Validate content structure for LLM-friendliness
 */
export function validateLLMFriendly(content: {
  title?: string
  headings?: Array<{ level: number; text: string }>
  sections?: Array<{ title: string; content: string }>
}): {
  valid: boolean
  score: number
  suggestions: string[]
} {
  const suggestions: string[] = []
  let score = 100

  // Check for title
  if (!content.title || content.title.length < 10) {
    suggestions.push('Add a clear, descriptive title (at least 10 characters)')
    score -= 20
  }

  // Check for headings
  if (!content.headings || content.headings.length === 0) {
    suggestions.push('Add headings (h2, h3) to structure content')
    score -= 30
  } else {
    // Check heading hierarchy
    const levels = content.headings.map((h) => h.level)
    const hasH1 = levels.includes(1)
    const hasH2 = levels.includes(2)

    if (!hasH1) {
      suggestions.push('Add an h1 heading for the main title')
      score -= 10
    }
    if (!hasH2) {
      suggestions.push('Add h2 headings for main sections')
      score -= 10
    }

    // Check for proper hierarchy (no skipping levels)
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i - 1] + 1) {
        suggestions.push("Don't skip heading levels (e.g., h2 to h4)")
        score -= 5
        break
      }
    }
  }

  // Check for sections
  if (!content.sections || content.sections.length === 0) {
    suggestions.push('Organize content into clear sections')
    score -= 20
  } else {
    // Check section content length
    const shortSections = content.sections.filter((s) => s.content.length < 50)
    if (shortSections.length > 0) {
      suggestions.push('Expand short sections with more detail')
      score -= 10
    }
  }

  return {
    valid: score >= 70,
    score,
    suggestions,
  }
}

/**
 * Structure content for LLM consumption
 */
export function structureContentForLLM(content: {
  title: string
  body: string
  metadata?: Record<string, unknown>
}): ContentStructure {
  // Extract headings from HTML or markdown
  const headingRegex = /<(h[1-6])[^>]*>(.*?)<\/h[1-6]>/gi
  const headings: Array<{ level: number; text: string; id?: string }> = []

  let match
  while ((match = headingRegex.exec(content.body)) !== null) {
    const level = parseInt(match[1].substring(1))
    const text = match[2].replace(/<[^>]*>/g, '').trim()
    headings.push({ level, text })
  }

  // Extract sections (content between headings)
  const sections: Array<{
    title: string
    content: string
    keyPoints?: string[]
  }> = []

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i]
    const nextHeadingIndex =
      i + 1 < headings.length ? headings[i + 1].level : null

    // Extract content for this section (simplified)
    const sectionContent = extractSectionContent(
      content.body,
      heading.text,
      nextHeadingIndex
    )
    const keyPoints = extractKeyPoints(sectionContent)

    sections.push({
      title: heading.text,
      content: sectionContent,
      keyPoints: keyPoints.length > 0 ? keyPoints : undefined,
    })
  }

  // Generate summary
  const summary = generateSummary(content.body)

  return {
    title: content.title,
    headings,
    sections,
    summary,
    metadata: content.metadata,
  }
}

/**
 * Extract section content (simplified implementation)
 */
function extractSectionContent(
  body: string,
  sectionTitle: string,
  nextSectionLevel: number | null
): string {
  // This is a simplified implementation
  // In a real scenario, you'd parse the HTML/markdown properly
  const titleIndex = body.indexOf(sectionTitle)
  if (titleIndex === -1) return ''

  // Find the next heading or end of content
  const nextHeadingRegex = /<h[1-6][^>]*>/gi
  nextHeadingRegex.lastIndex = titleIndex + sectionTitle.length

  const nextMatch = nextHeadingRegex.exec(body)
  const endIndex = nextMatch ? nextMatch.index : body.length

  const sectionHtml = body.substring(titleIndex, endIndex)
  // Remove HTML tags for content extraction
  return sectionHtml
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Generate LLM-friendly content summary
 */
export function generateLLMSummary(content: ContentStructure): string {
  const parts: string[] = []

  parts.push(`Title: ${content.title}`)

  if (content.summary) {
    parts.push(`Summary: ${content.summary}`)
  }

  if (content.sections && content.sections.length > 0) {
    parts.push('\nSections:')
    content.sections.forEach((section, index) => {
      parts.push(`${index + 1}. ${section.title}`)
      if (section.keyPoints && section.keyPoints.length > 0) {
        section.keyPoints.forEach((point) => {
          parts.push(`   - ${point}`)
        })
      }
    })
  }

  if (content.metadata) {
    parts.push('\nMetadata:')
    Object.entries(content.metadata).forEach(([key, value]) => {
      parts.push(`${key}: ${value}`)
    })
  }

  return parts.join('\n')
}
