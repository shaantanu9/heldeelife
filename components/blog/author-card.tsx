'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Award, BookOpen, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface AuthorCardProps {
  author?: {
    name?: string
    email?: string
    image?: string
  }
  postCount?: number
  readingTime?: number
  viewsCount?: number
}

export function AuthorCard({
  author,
  postCount,
  readingTime,
  viewsCount,
}: AuthorCardProps) {
  const authorName = author?.name || 'heldeelife Team'
  const authorImage = author?.image

  return (
    <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50/50 to-white shadow-md">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* Author Avatar */}
          <div className="flex items-center gap-4">
            {authorImage ? (
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-orange-200 flex-shrink-0">
                <Image
                  src={authorImage}
                  alt={authorName}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center border-2 border-orange-200 flex-shrink-0">
                <User className="h-8 w-8 text-orange-600" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {authorName}
              </h3>
              <Badge variant="secondary" className="text-xs gap-1">
                <Award className="h-3 w-3" />
                Expert Author
              </Badge>
            </div>
          </div>

          {/* Author Bio */}
          <p className="text-gray-600 text-sm leading-relaxed">
            Health & wellness expert with years of experience in Ayurveda and
            modern medicine. Trusted by 50,000+ readers.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm pt-2 border-t border-gray-200">
            {viewsCount !== undefined && viewsCount > 0 && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <span className="text-base">👁️</span>
                <span>{viewsCount.toLocaleString()} Views</span>
              </div>
            )}
            {readingTime && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <BookOpen className="h-4 w-4" />
                <span>{readingTime} min read</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-orange-300 text-orange-600 hover:bg-orange-50 w-full mt-2"
          >
            <Link href="/blog">
              Read More Articles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
