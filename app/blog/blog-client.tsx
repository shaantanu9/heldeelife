'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  Eye,
  X,
  Search,
  ArrowRight,
  TrendingUp,
  Star,
  BookOpen,
  Sparkles,
  Award,
  Users,
  Shield,
} from 'lucide-react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Lazy load heavy components
const Newsletter = dynamic(
  () =>
    import('@/components/sections/newsletter').then((mod) => ({
      default: mod.Newsletter,
    })),
  {
    ssr: true,
  }
)

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  featured_image?: string
  published_at?: string
  reading_time?: number
  views_count: number
  created_at: string
  category?: {
    id: string
    name: string
    slug: string
  }
  tags?: Array<{
    id: string
    name: string
    slug: string
  }>
}

interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
}

interface BlogTag {
  id: string
  name: string
  slug: string
}

interface BlogClientProps {
  posts: BlogPost[]
  categories: BlogCategory[]
  tags: BlogTag[]
}

export function BlogClient({ posts, categories, tags }: BlogClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')

  const activeCategory = searchParams.get('category')
  const activeTag = searchParams.get('tag')

  const handleCategoryClick = (categorySlug: string | null) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (categorySlug) {
        params.set('category', categorySlug)
      } else {
        params.delete('category')
      }
      params.delete('tag')
      router.push(`/blog?${params.toString()}`)
    })
  }

  const handleTagClick = (tagSlug: string | null) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (tagSlug) {
        params.set('tag', tagSlug)
      } else {
        params.delete('tag')
      }
      params.delete('category')
      router.push(`/blog?${params.toString()}`)
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      } else {
        params.delete('search')
      }
      router.push(`/blog?${params.toString()}`)
    })
  }

  const clearFilters = () => {
    startTransition(() => {
      router.push('/blog')
    })
  }

  // Filter posts by search query if provided
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts
    const query = searchQuery.toLowerCase()
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query) ||
        post.category?.name.toLowerCase().includes(query) ||
        post.tags?.some((tag) => tag.name.toLowerCase().includes(query))
    )
  }, [posts, searchQuery])

  // Get featured posts (most viewed or recent)
  const featuredPosts = useMemo(() => {
    return [...filteredPosts]
      .sort((a, b) => {
        // Sort by views first, then by published date
        if (b.views_count !== a.views_count) {
          return b.views_count - a.views_count
        }
        return (
          new Date(b.published_at || b.created_at).getTime() -
          new Date(a.published_at || a.created_at).getTime()
        )
      })
      .slice(0, 3)
  }, [filteredPosts])

  // Get regular posts (excluding featured)
  const regularPosts = useMemo(() => {
    const featuredIds = new Set(featuredPosts.map((p) => p.id))
    return filteredPosts.filter((p) => !featuredIds.has(p.id))
  }, [filteredPosts, featuredPosts])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40">
      {/* Hero Section - AIDA Framework Applied */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 50 L90 10 L50 50 L10 10 Z' fill='%23EA580C'/%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="container relative z-10 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Attention: Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full text-sm text-orange-700 font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Expert Health Insights & Wellness Tips</span>
            </div>

            {/* Interest: Headline */}
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-orange-600 font-light">
                HEALTH & WELLNESS BLOG
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                Discover Expert Insights on{' '}
                <span className="text-orange-600">Health & Wellness</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Evidence-based articles on Ayurveda, modern medicine, and
                holistic wellness. Trusted by 50,000+ readers.
              </p>
            </div>

            {/* Desire: Key Benefits */}
            <div className="grid sm:grid-cols-3 gap-4 pt-4 max-w-2xl mx-auto">
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-orange-600" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  Expert Articles
                </p>
                <p className="text-xs text-gray-600 text-center">
                  Doctor-written content
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  Evidence-Based
                </p>
                <p className="text-xs text-gray-600 text-center">
                  Research-backed insights
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  50K+ Readers
                </p>
                <p className="text-xs text-gray-600 text-center">
                  Trusted community
                </p>
              </div>
            </div>

            {/* Action: Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search articles, topics, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-orange-500 rounded-lg"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isPending}
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-white h-12 px-6 rounded-lg"
                >
                  {isPending ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </form>

            {/* Social Proof: Quick Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {posts.length}+
                </p>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Articles
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">4.8★</p>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Average Rating
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">50K+</p>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Monthly Readers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals Section */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Shield, text: '100% Authentic', color: 'text-green-600' },
              { icon: Award, text: 'Expert Verified', color: 'text-blue-600' },
              { icon: Star, text: '4.8/5 Rating', color: 'text-yellow-600' },
              {
                icon: Users,
                text: '50K+ Readers',
                color: 'text-orange-600',
              },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={index}
                  className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Icon className={`h-8 w-8 ${item.color} mb-2`} />
                  <p className="font-semibold text-sm text-gray-900">
                    {item.text}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Active Filters */}
        {(activeCategory || activeTag) && (
          <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
            <span className="text-sm text-gray-600">Active filters:</span>
            {activeCategory && (
              <Badge variant="secondary" className="gap-2">
                Category:{' '}
                {categories.find((c) => c.slug === activeCategory)?.name ||
                  activeCategory}
                <button
                  onClick={() => handleCategoryClick(null)}
                  className="hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {activeTag && (
              <Badge variant="secondary" className="gap-2">
                Tag: {tags.find((t) => t.slug === activeTag)?.name || activeTag}
                <button
                  onClick={() => handleTagClick(null)}
                  className="hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories and Tags */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={!activeCategory ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handleCategoryClick(null)}
                >
                  All Categories
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      activeCategory === category.slug ? 'default' : 'ghost'
                    }
                    className="w-full justify-start"
                    onClick={() => handleCategoryClick(category.slug)}
                  >
                    {category.name}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 10).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={activeTag === tag.slug ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-orange-100 transition-colors"
                      onClick={() => handleTagClick(tag.slug)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA Card - Conversion Element */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">
                  Shop Authentic Products
                </CardTitle>
                <CardDescription className="text-gray-700">
                  Discover our curated collection of Ayurvedic and modern
                  medicine products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Link href="/shop">
                    Browse Products
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content - Blog Posts */}
          <div className="lg:col-span-3">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-600 text-lg mb-4">
                  {searchQuery.trim() || activeCategory || activeTag
                    ? 'No blog posts found matching your criteria.'
                    : 'No blog posts yet. Check back soon!'}
                </p>
                {(activeCategory || activeTag || searchQuery.trim()) && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Featured Posts Section - Von Restorff Effect */}
                {featuredPosts.length > 0 && !activeCategory && !activeTag && (
                  <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                      <h2 className="text-2xl font-bold text-gray-900">
                        Featured Articles
                      </h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                      {featuredPosts.map((post, index) => (
                        <Card
                          key={post.id}
                          className={`flex flex-col border-2 ${
                            index === 0
                              ? 'md:col-span-2 md:row-span-2 border-orange-300 shadow-xl'
                              : 'border-gray-200 shadow-md'
                          } hover:shadow-xl transition-all duration-300 bg-white group overflow-hidden`}
                        >
                          <Link href={`/blog/${post.slug}`} className="block">
                            {post.featured_image ? (
                              <div
                                className={`relative w-full overflow-hidden ${
                                  index === 0 ? 'h-64' : 'h-48'
                                }`}
                              >
                                <Image
                                  src={post.featured_image}
                                  alt={post.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                {index === 0 && (
                                  <div className="absolute top-4 left-4">
                                    <Badge className="bg-orange-600 text-white">
                                      <Star className="h-3 w-3 mr-1" />
                                      Featured
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div
                                className={`w-full bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center ${
                                  index === 0 ? 'h-64' : 'h-48'
                                }`}
                              >
                                <span className="text-6xl opacity-40">📝</span>
                              </div>
                            )}
                          </Link>

                          <CardHeader className="flex-1">
                            {post.category && (
                              <Link
                                href={`/blog?category=${post.category.slug}`}
                              >
                                <Badge
                                  variant="secondary"
                                  className="mb-2 w-fit hover:bg-orange-600 hover:text-white transition-colors cursor-pointer"
                                >
                                  {post.category.name}
                                </Badge>
                              </Link>
                            )}
                            <CardTitle
                              className={`mb-2 ${
                                index === 0 ? 'text-2xl' : 'text-xl'
                              }`}
                            >
                              <Link
                                href={`/blog/${post.slug}`}
                                className="hover:text-orange-600 transition-colors text-gray-900 group-hover:text-orange-600 line-clamp-2"
                              >
                                {post.title}
                              </Link>
                            </CardTitle>
                            <CardDescription
                              className={`${
                                index === 0 ? 'line-clamp-4' : 'line-clamp-3'
                              } text-gray-600`}
                            >
                              {post.excerpt || 'Read more...'}
                            </CardDescription>
                          </CardHeader>

                          <CardFooter className="flex items-center justify-between text-sm text-gray-600 border-t pt-4">
                            <div className="flex items-center gap-4">
                              {post.reading_time && (
                                <div
                                  className="flex items-center gap-1"
                                  title="Reading time"
                                >
                                  <Clock className="h-4 w-4" />
                                  <span>{post.reading_time} min</span>
                                </div>
                              )}
                              {post.views_count > 0 && (
                                <div
                                  className="flex items-center gap-1"
                                  title="Views"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>{post.views_count}</span>
                                </div>
                              )}
                            </div>
                            {post.published_at && (
                              <div
                                className="flex items-center gap-1"
                                title="Published date"
                              >
                                <Calendar className="h-4 w-4" />
                                <time dateTime={post.published_at}>
                                  {new Date(
                                    post.published_at
                                  ).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </time>
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular Posts Grid */}
                {regularPosts.length > 0 && (
                  <div>
                    {featuredPosts.length > 0 &&
                      !activeCategory &&
                      !activeTag && (
                        <div className="flex items-center gap-2 mb-6">
                          <BookOpen className="h-5 w-5 text-gray-600" />
                          <h2 className="text-2xl font-bold text-gray-900">
                            Latest Articles
                          </h2>
                        </div>
                      )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {regularPosts.map((post) => (
                        <Card
                          key={post.id}
                          className="flex flex-col border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white group overflow-hidden"
                        >
                          <Link href={`/blog/${post.slug}`} className="block">
                            {post.featured_image ? (
                              <div className="relative w-full h-48 overflow-hidden">
                                <Image
                                  src={post.featured_image}
                                  alt={post.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-48 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                                <span className="text-6xl opacity-40">📝</span>
                              </div>
                            )}
                          </Link>

                          <CardHeader className="flex-1">
                            {post.category && (
                              <Link
                                href={`/blog?category=${post.category.slug}`}
                              >
                                <Badge
                                  variant="secondary"
                                  className="mb-2 w-fit hover:bg-orange-600 hover:text-white transition-colors cursor-pointer"
                                >
                                  {post.category.name}
                                </Badge>
                              </Link>
                            )}
                            <CardTitle className="line-clamp-2 mb-2">
                              <Link
                                href={`/blog/${post.slug}`}
                                className="hover:text-orange-600 transition-colors text-gray-900 group-hover:text-orange-600"
                              >
                                {post.title}
                              </Link>
                            </CardTitle>
                            <CardDescription className="line-clamp-3 text-gray-600">
                              {post.excerpt || 'Read more...'}
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="flex-1">
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {post.tags.slice(0, 3).map((tag) => (
                                  <Link
                                    key={tag.id}
                                    href={`/blog?tag=${tag.slug}`}
                                  >
                                    <Badge
                                      variant="outline"
                                      className="text-xs hover:bg-orange-600 hover:text-white transition-colors cursor-pointer"
                                    >
                                      {tag.name}
                                    </Badge>
                                  </Link>
                                ))}
                                {post.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{post.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </CardContent>

                          <CardFooter className="flex items-center justify-between text-sm text-gray-600 border-t pt-4">
                            <div className="flex items-center gap-4">
                              {post.reading_time && (
                                <div
                                  className="flex items-center gap-1"
                                  title="Reading time"
                                >
                                  <Clock className="h-4 w-4" />
                                  <span>{post.reading_time} min</span>
                                </div>
                              )}
                              {post.views_count > 0 && (
                                <div
                                  className="flex items-center gap-1"
                                  title="Views"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>{post.views_count}</span>
                                </div>
                              )}
                            </div>
                            {post.published_at && (
                              <div
                                className="flex items-center gap-1"
                                title="Published date"
                              >
                                <Calendar className="h-4 w-4" />
                                <time dateTime={post.published_at}>
                                  {new Date(
                                    post.published_at
                                  ).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </time>
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Newsletter Section - Lead Capture */}
      <Newsletter />
    </div>
  )
}
