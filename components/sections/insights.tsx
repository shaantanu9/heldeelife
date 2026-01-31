'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { ArrowRight, Clock, Eye, BookOpen, Calendar } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { useEffect, useState } from 'react'

interface Insight {
  id: string
  title: string
  slug: string
  excerpt?: string
  featured_image?: string
  published_at?: string
  created_at: string
  reading_time?: number
  views_count?: number
  category?: {
    id: string
    name: string
    slug: string
  }
}

export function Insights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInsights() {
      try {
        const response = await fetch('/api/insights?limit=6')
        if (response.ok) {
          const data = await response.json()
          setInsights(data.posts || [])
        }
      } catch (error) {
        console.error('Error fetching insights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [])

  if (loading) {
    return (
      <section className="py-24 bg-white">
        <div className="container px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (insights.length === 0) {
    return null // Don't show section if no insights
  }

  return (
    <section className="py-24 bg-white">
      <div className="container px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-orange-600 font-light mb-4">
                HEALTH INSIGHTS
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Expert{' '}
                <span className="text-orange-600">Health Insights</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl">
                Evidence-based articles and guides to help you make informed
                decisions about your health and wellness.
              </p>
            </div>
            <Button
              asChild
              className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Link href="/insights">
                View All Articles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Insights Carousel */}
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {insights.map((insight) => {
                const publishedDate = insight.published_at
                  ? new Date(insight.published_at)
                  : new Date(insight.created_at)
                const timeAgo = formatDistanceToNow(publishedDate, {
                  addSuffix: true,
                })

                return (
                  <CarouselItem
                    key={insight.id}
                    className="md:basis-1/2 lg:basis-1/3"
                  >
                    <Link href={`/insights/${insight.slug}`}>
                      <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white h-full group">
                        <CardContent className="p-0">
                          {/* Image */}
                          <div className="aspect-video bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center relative overflow-hidden">
                            {insight.featured_image ? (
                              <Image
                                src={insight.featured_image}
                                alt={insight.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                                unoptimized
                              />
                            ) : (
                              <span className="text-7xl opacity-60 group-hover:scale-110 transition-transform">
                                🌿
                              </span>
                            )}
                            {/* Category Badge */}
                            {insight.category && (
                              <div className="absolute top-4 left-4">
                                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-orange-600">
                                  {insight.category.name}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-6">
                            {/* Meta Info */}
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 flex-wrap">
                              {insight.reading_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{insight.reading_time} min read</span>
                                </div>
                              )}
                              {insight.views_count && insight.views_count > 0 && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    <span>
                                      {insight.views_count > 1000
                                        ? `${(insight.views_count / 1000).toFixed(1)}K views`
                                        : `${insight.views_count} views`}
                                    </span>
                                  </div>
                                </>
                              )}
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{timeAgo}</span>
                              </div>
                            </div>

                            {/* Title */}
                            <h3 className="font-bold text-xl mb-3 text-gray-900 leading-snug group-hover:text-orange-600 transition-colors">
                              {insight.title}
                            </h3>

                            {/* Description */}
                            {insight.excerpt && (
                              <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                                {insight.excerpt}
                              </p>
                            )}

                            {/* CTA */}
                            <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm group-hover:gap-3 transition-all">
                              <span>Read Article</span>
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
            <CarouselPrevious className="border-gray-300 hover:border-orange-500 text-gray-600 hover:text-orange-600" />
            <CarouselNext className="border-gray-300 hover:border-orange-500 text-gray-600 hover:text-orange-600" />
          </Carousel>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Stay updated with the latest health insights and wellness tips
            </p>
            <Button
              variant="outline"
              size="lg"
              className="rounded-lg border-2 border-orange-600 text-orange-600 hover:bg-orange-50 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              asChild
            >
              <Link href="/insights">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse All Articles
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
