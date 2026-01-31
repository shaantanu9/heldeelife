'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Eye, Share2 } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

interface InsightClientProps {
  post: any
  relatedPosts: any[]
}

export function InsightClient({ post, relatedPosts }: InsightClientProps) {
  const publishedDate = post.published_at
    ? new Date(post.published_at)
    : new Date(post.created_at)
  const timeAgo = formatDistanceToNow(publishedDate, { addSuffix: true })

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.title,
          url: window.location.href,
        })
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <Link
          href="/insights"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Insights
        </Link>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-4 flex-wrap">
              {post.category && (
                <>
                  <span className="text-orange-600 font-semibold">
                    {post.category.name}
                  </span>
                  <span>•</span>
                </>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{timeAgo}</span>
              </div>
              {post.reading_time && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{post.reading_time} min read</span>
                  </div>
                </>
              )}
              {post.views_count > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{post.views_count} views</span>
                  </div>
                </>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-xl text-gray-600">{post.excerpt}</p>
            )}
          </div>

          {/* Featured Image */}
          {post.featured_image && (
            <Card className="border border-gray-200 shadow-xl mb-8 bg-white">
              <CardContent className="p-0">
                <div className="aspect-video relative">
                  <Image
                    src={post.featured_image}
                    alt={post.title}
                    fill
                    className="object-cover rounded-lg"
                    unoptimized
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          <Card className="border border-gray-200 shadow-xl bg-white mb-8">
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag: any) => (
                <Link
                  key={tag.id}
                  href={`/blog?tag=${tag.slug}`}
                  className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm font-medium hover:bg-orange-100 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Share Button */}
          <div className="flex items-center gap-4 mb-12">
            <Button
              variant="outline"
              onClick={handleShare}
              className="rounded-lg"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Article
            </Button>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Related Insights
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => {
                  const relatedDate = relatedPost.published_at
                    ? new Date(relatedPost.published_at)
                    : new Date(relatedPost.created_at)
                  const relatedTimeAgo = formatDistanceToNow(relatedDate, {
                    addSuffix: true,
                  })

                  return (
                    <Link
                      key={relatedPost.id}
                      href={`/insights/${relatedPost.slug}`}
                    >
                      <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white group">
                        <CardContent className="p-0">
                          <div className="aspect-video bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center group-hover:from-orange-100 group-hover:to-orange-200 transition-colors relative overflow-hidden">
                            {relatedPost.featured_image ? (
                              <Image
                                src={relatedPost.featured_image}
                                alt={relatedPost.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <span className="text-5xl opacity-60">🌿</span>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold text-lg mb-2 text-gray-900 leading-snug group-hover:text-orange-600 transition-colors line-clamp-2">
                              {relatedPost.title}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {relatedTimeAgo}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}









