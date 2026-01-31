'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, Monitor, Smartphone, X } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

interface BlogPreviewProps {
  title: string
  content: string
  excerpt?: string
  featuredImage?: string
  metaDescription?: string
}

export function BlogPreview({
  title,
  content,
  excerpt,
  featuredImage,
  metaDescription,
}: BlogPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        <Eye className="h-4 w-4 mr-2" />
        Preview
      </Button>
    )
  }

  // Extract plain text from HTML for preview
  const plainContent = content.replace(/<[^>]*>/g, '')

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col">
      <CardHeader className="flex items-center justify-between border-b">
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Live Preview
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant={previewMode === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('desktop')}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Desktop
          </Button>
          <Button
            variant={previewMode === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('mobile')}
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Mobile
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        <div
          className={`${
            previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'max-w-4xl mx-auto'
          } p-6 bg-white min-h-full`}
        >
          {/* SEO Preview */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-sm font-semibold mb-2">Search Engine Preview</h3>
            <div className="space-y-1">
              <div className="text-lg text-blue-600 hover:underline cursor-pointer">
                {title || 'Your Post Title'}
              </div>
              <div className="text-sm text-green-700">
                {process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'}
                /blog/{title?.toLowerCase().replace(/\s+/g, '-') || 'post-slug'}
              </div>
              <div className="text-sm text-gray-600">
                {metaDescription || excerpt || 'Post description will appear here...'}
              </div>
            </div>
          </div>

          {/* Blog Post Preview */}
          <article>
            {featuredImage && (
              <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
                <Image
                  src={featuredImage}
                  alt={title || 'Featured image'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            <h1 className="text-4xl font-bold mb-4">{title || 'Your Post Title'}</h1>

            {excerpt && (
              <p className="text-xl text-gray-600 mb-6 italic">{excerpt}</p>
            )}

            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: content || '<p>Start writing your content...</p>' }}
            />
          </article>
        </div>
      </CardContent>
      </Card>
    </div>
  )
}

