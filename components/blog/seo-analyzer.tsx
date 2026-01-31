'use client'

import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2,
  AlertCircle,
  Info,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { analyzeReadability } from '@/lib/utils/readability'

export interface SEOSuggestion {
  type: 'error' | 'warning' | 'info' | 'success'
  field: string
  message: string
  fix?: string
}

interface SEOAnalyzerProps {
  title: string
  metaDescription?: string
  content: string
  featuredImage?: string
  tags: string[]
  category?: string
  slug?: string
}

export function SEOAnalyzer({
  title,
  metaDescription,
  content,
  featuredImage,
  tags,
  category,
  slug,
}: SEOAnalyzerProps) {
  const { suggestions, score } = useMemo(() => {
    const suggestions: SEOSuggestion[] = []
    let score = 0

    // Title analysis
    if (!title) {
      suggestions.push({
        type: 'error',
        field: 'title',
        message: 'Title is required',
        fix: 'Add a descriptive title',
      })
    } else {
      const titleLength = title.length
      if (titleLength < 30) {
        suggestions.push({
          type: 'warning',
          field: 'title',
          message: `Title is too short (${titleLength} characters)`,
          fix: 'Aim for 50-60 characters for optimal SEO',
        })
        score += 10
      } else if (titleLength >= 30 && titleLength <= 60) {
        suggestions.push({
          type: 'success',
          field: 'title',
          message: `Title length is optimal (${titleLength} characters)`,
        })
        score += 25
      } else if (titleLength > 60) {
        suggestions.push({
          type: 'warning',
          field: 'title',
          message: `Title is too long (${titleLength} characters)`,
          fix: 'Keep title under 60 characters to avoid truncation',
        })
        score += 15
      } else {
        score += 15
      }
    }

    // Meta description analysis
    if (!metaDescription) {
      suggestions.push({
        type: 'warning',
        field: 'meta_description',
        message: 'Meta description is missing',
        fix: 'Add a compelling meta description (120-160 characters)',
      })
    } else {
      const descLength = metaDescription.length
      if (descLength < 120) {
        suggestions.push({
          type: 'warning',
          field: 'meta_description',
          message: `Meta description is too short (${descLength} characters)`,
          fix: 'Aim for 120-160 characters',
        })
        score += 10
      } else if (descLength >= 120 && descLength <= 160) {
        suggestions.push({
          type: 'success',
          field: 'meta_description',
          message: `Meta description length is optimal (${descLength} characters)`,
        })
        score += 25
      } else if (descLength > 160) {
        suggestions.push({
          type: 'warning',
          field: 'meta_description',
          message: `Meta description is too long (${descLength} characters)`,
          fix: 'Keep under 160 characters to avoid truncation',
        })
        score += 15
      } else {
        score += 15
      }
    }

    // Content analysis
    const plainContent = content.replace(/<[^>]*>/g, '')
    const contentLength = plainContent.length
    const wordCount = plainContent.split(/\s+/).filter((w) => w.length > 0).length

    if (contentLength < 500) {
      suggestions.push({
        type: 'error',
        field: 'content',
        message: `Content is too short (${wordCount} words)`,
        fix: 'Aim for at least 1000 words for better SEO',
      })
      score += 5
    } else if (contentLength >= 500 && contentLength < 1000) {
      suggestions.push({
        type: 'warning',
        field: 'content',
        message: `Content could be longer (${wordCount} words)`,
        fix: 'Aim for 1000+ words for optimal SEO',
      })
      score += 10
    } else {
      suggestions.push({
        type: 'success',
        field: 'content',
        message: `Content length is good (${wordCount} words)`,
      })
      score += 20
    }

    // Featured image
    if (!featuredImage) {
      suggestions.push({
        type: 'warning',
        field: 'featured_image',
        message: 'Featured image is missing',
        fix: 'Add a featured image to improve engagement',
      })
    } else {
      suggestions.push({
        type: 'success',
        field: 'featured_image',
        message: 'Featured image is set',
      })
      score += 10
    }

    // Tags
    if (tags.length === 0) {
      suggestions.push({
        type: 'warning',
        field: 'tags',
        message: 'No tags added',
        fix: 'Add at least 3-5 relevant tags',
      })
    } else if (tags.length < 3) {
      suggestions.push({
        type: 'info',
        field: 'tags',
        message: `Only ${tags.length} tag(s) added`,
        fix: 'Add more tags (3-5 recommended)',
      })
      score += 5
    } else {
      suggestions.push({
        type: 'success',
        field: 'tags',
        message: `${tags.length} tags added`,
      })
      score += 10
    }

    // Category
    if (!category) {
      suggestions.push({
        type: 'info',
        field: 'category',
        message: 'No category selected',
        fix: 'Select a category to improve organization',
      })
    } else {
      suggestions.push({
        type: 'success',
        field: 'category',
        message: 'Category is set',
      })
      score += 5
    }

    // Slug
    if (!slug) {
      suggestions.push({
        type: 'warning',
        field: 'slug',
        message: 'Slug is missing',
        fix: 'Generate a URL-friendly slug',
      })
    } else {
      const slugLength = slug.length
      if (slugLength > 60) {
        suggestions.push({
          type: 'warning',
          field: 'slug',
          message: 'Slug is too long',
          fix: 'Keep slug under 60 characters',
        })
      } else {
        suggestions.push({
          type: 'success',
          field: 'slug',
          message: 'Slug is set',
        })
      }
    }

    // Readability analysis
    const readability = analyzeReadability(content)
    if (readability.fleschReadingEase < 60) {
      suggestions.push({
        type: 'warning',
        field: 'readability',
        message: `Reading level: ${readability.readingLevel} (Score: ${readability.fleschReadingEase})`,
        fix: 'Use simpler words and shorter sentences',
      })
    } else {
      suggestions.push({
        type: 'success',
        field: 'readability',
        message: `Reading level: ${readability.readingLevel} (Score: ${readability.fleschReadingEase})`,
      })
    }

    // Add readability suggestions
    readability.suggestions.forEach((suggestion) => {
      suggestions.push({
        type: 'info',
        field: 'readability',
        message: suggestion,
      })
    })

    return { suggestions, score: Math.min(100, score) }
  }, [title, metaDescription, content, featuredImage, tags, category, slug])

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive'
      case 'warning':
        return 'secondary'
      case 'success':
        return 'default'
      default:
        return 'outline'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              SEO Analysis
            </CardTitle>
            <CardDescription>Real-time SEO feedback and suggestions</CardDescription>
          </div>
          <Badge
            variant={score >= 70 ? 'default' : score >= 50 ? 'secondary' : 'destructive'}
            className="text-lg px-3 py-1"
          >
            {score}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <Alert
              key={index}
              variant={
                suggestion.type === 'error'
                  ? 'destructive'
                  : suggestion.type === 'warning'
                    ? 'default'
                    : 'default'
              }
              className={
                suggestion.type === 'success'
                  ? 'border-green-200 bg-green-50'
                  : suggestion.type === 'info'
                    ? 'border-blue-200 bg-blue-50'
                    : ''
              }
            >
              <div className="flex items-start gap-3">
                {getIcon(suggestion.type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getBadgeVariant(suggestion.type)} className="text-xs">
                      {suggestion.field}
                    </Badge>
                    <AlertDescription className="text-sm font-medium">
                      {suggestion.message}
                    </AlertDescription>
                  </div>
                  {suggestion.fix && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 {suggestion.fix}
                    </p>
                  )}
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}






