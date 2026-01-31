'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Calendar, Clock, Eye } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

interface InsightsClientProps {
  posts: any[]
}

export function InsightsClient({ posts }: InsightsClientProps) {
  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
        <div className="container px-4">
          <div className="text-center py-24">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              <span className="text-orange-600">Insights</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              No insights articles available yet. Check back soon!
            </p>
            <Button
              asChild
              className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Link href="/blog">View All Blog Posts</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              <span className="text-orange-600">Health Insights</span> & Learning
            </h1>
            <p className="text-xl text-gray-600">
              Expert health insights, wellness tips, and educational content to
              support your wellness journey
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const publishedDate = post.published_at
              ? new Date(post.published_at)
              : new Date(post.created_at)
            const timeAgo = formatDistanceToNow(publishedDate, {
              addSuffix: true,
            })

            return (
              <Card
                key={post.id}
                className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white group"
              >
                <CardContent className="p-0">
                  <Link href={`/insights/${post.slug}`}>
                    <div className="aspect-video bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center group-hover:from-orange-100 group-hover:to-orange-200 transition-colors relative overflow-hidden">
                      {post.featured_image ? (
                        <Image
                          src={post.featured_image}
                          alt={post.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-7xl opacity-60">🌿</span>
                      )}
                    </div>
                  </Link>
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
                      {post.category && (
                        <>
                          <span className="text-orange-600 font-semibold">
                            {post.category.name}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{timeAgo}</span>
                      </div>
                      {post.reading_time && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{post.reading_time} min read</span>
                          </div>
                        </>
                      )}
                      {post.views_count > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{post.views_count} views</span>
                          </div>
                        </>
                      )}
                    </div>
                    <Link href={`/insights/${post.slug}`}>
                      <h3 className="font-bold text-xl mb-3 text-gray-900 leading-snug group-hover:text-orange-600 transition-colors">
                        {post.title}
                      </h3>
                    </Link>
                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed text-sm">
                        {post.excerpt}
                      </p>
                    )}
                    <Link
                      href={`/insights/${post.slug}`}
                      className="text-orange-600 hover:text-orange-700 font-semibold transition-colors inline-flex items-center gap-2 text-sm"
                    >
                      Read More
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}









