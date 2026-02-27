import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import {
  getBlogPostByIdForPreview,
  getRelatedBlogPosts,
} from '@/lib/utils/blog-query'
import { processBlogContent } from '@/lib/utils/blog-content'
import { getProducts } from '@/lib/api/server'
import { BlogContentWithProducts } from '@/components/blog/blog-content-with-products'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Eye, ArrowLeft, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { RelatedProductsSection } from '@/components/blog/related-products-section'
import { TableOfContents } from '@/components/blog/table-of-contents'
import { AuthorCard } from '@/components/blog/author-card'
import { ShareButtons } from '@/components/blog/share-buttons'
import { SidebarTrustSignals } from '@/components/blog/sidebar-trust-signals'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'

const NewsletterLazy = dynamic(
  () =>
    import('@/components/sections/newsletter').then((mod) => ({
      default: mod.Newsletter,
    })),
  { ssr: true }
)

export const metadata: Metadata = {
  title: 'Preview | heldeelife',
  robots: { index: false, follow: false },
}

export default async function BlogPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.role === 'admin'

  if (!isAdmin) {
    notFound()
  }

  const post = await getBlogPostByIdForPreview(id)
  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedBlogPosts(
    post.id,
    post.category_id,
    post.tags?.map((t: { id: string }) => t.id) || [],
    3
  )
  const suggestedProducts = await getProducts({ featured: true, limit: 6 })
  const postContent = post.content || ''
  const processedContent = processBlogContent(postContent)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'

  return (
    <>
      {/* Preview mode banner - sticky */}
      <div className="sticky top-0 z-40 w-full bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between gap-4 shadow-md">
        <span className="text-sm font-medium">
          Preview mode — This post may be a draft. Not visible to visitors.
        </span>
        <div className="flex items-center gap-2">
          <Link href={`/admin/blog/${id}`}>
            <Button variant="secondary" size="sm" className="gap-1.5">
              Edit post
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link href="/admin/blog">
            <Button variant="outline" size="sm">
              Back to list
            </Button>
          </Link>
        </div>
      </div>

      <div className="min-h-screen bg-background overflow-x-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <article className="lg:col-span-8">
              <div className="max-w-3xl mx-auto">
                <div className="mb-6 sm:mb-8">
                  <Breadcrumb>
                    <BreadcrumbList className="items-center">
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="mx-1.5" />
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
                      </BreadcrumbItem>
                      {post.category && (
                        <>
                          <BreadcrumbSeparator className="mx-1.5" />
                          <BreadcrumbItem>
                            <BreadcrumbLink
                              href={`/blog?category=${post.category.slug}`}
                            >
                              {post.category.name}
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                        </>
                      )}
                      <BreadcrumbSeparator className="mx-1.5" />
                      <BreadcrumbItem className="max-w-[500px]">
                        <BreadcrumbPage className="font-medium truncate">
                          {post.title}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>

                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-orange-600 mb-6 sm:mb-8 transition-colors text-sm sm:text-base"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Blog
                </Link>

                {post.category && (
                  <Link href={`/blog?category=${post.category.slug}`}>
                    <Badge
                      variant="secondary"
                      className="mb-4 sm:mb-6 hover:bg-orange-600 hover:text-white transition-colors cursor-pointer"
                    >
                      {post.category.name}
                    </Badge>
                  </Link>
                )}

                <header className="mb-8 sm:mb-12">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight tracking-tight text-foreground">
                    {post.title}
                  </h1>
                  {post.excerpt && (
                    <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed font-light">
                      {post.excerpt}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm sm:text-base text-muted-foreground border-b border-border pb-6 sm:pb-8">
                    {post.author?.name && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                          <span className="text-xs font-semibold text-orange-600">
                            {post.author.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">
                          {post.author.name}
                        </span>
                      </div>
                    )}
                    {(post.published_at || post.created_at) && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <time
                          dateTime={
                            post.published_at || post.created_at || ''
                          }
                        >
                          {new Date(
                            post.published_at || post.created_at
                          ).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </time>
                      </div>
                    )}
                    {post.reading_time && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{post.reading_time} min read</span>
                      </div>
                    )}
                    {post.views_count > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-4 w-4" />
                        <span>{post.views_count.toLocaleString()} views</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-6 sm:mb-8 pb-6 border-b border-border">
                    <ShareButtons
                      url={`${baseUrl}/blog/${post.slug}`}
                      title={post.title}
                      description={post.excerpt || ''}
                    />
                  </div>
                </header>

                {post.featured_image && (
                  <div className="relative w-full mb-8 sm:mb-12 rounded-xl overflow-hidden shadow-xl border-2 border-border">
                    <div className="relative w-full aspect-video sm:aspect-[21/9]">
                      <Image
                        src={post.featured_image}
                        alt={post.title || 'Featured image'}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
                        unoptimized
                      />
                    </div>
                  </div>
                )}

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8 sm:mb-12">
                    {post.tags.map((tag: any) => (
                      <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                        <Badge
                          variant="outline"
                          className="text-xs sm:text-sm hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-colors cursor-pointer"
                        >
                          {tag.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}

                {(processedContent || postContent) ? (
                  <section className="mb-12 sm:mb-16">
                    <BlogContentWithProducts
                      content={processedContent || postContent}
                    />
                  </section>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No content available for this post.</p>
                  </div>
                )}

                <div className="my-12 py-8 border-y border-border bg-muted/30 rounded-lg px-6">
                  <div className="text-center mb-4">
                    <p className="text-sm font-semibold text-foreground mb-2">
                      Enjoyed this article?
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Share it with others who might find it helpful!
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <ShareButtons
                      url={`${baseUrl}/blog/${post.slug}`}
                      title={post.title}
                      description={post.excerpt || ''}
                    />
                  </div>
                </div>

                <footer className="border-t border-border pt-8 sm:pt-12 mt-12 sm:mt-16">
                  {post.category && (
                    <div className="mb-6">
                      <h3 className="text-sm sm:text-base font-semibold mb-3 text-foreground">
                        Category:
                      </h3>
                      <Link href={`/blog?category=${post.category.slug}`}>
                        <Badge
                          variant="secondary"
                          className="hover:bg-orange-600 hover:text-white transition-colors cursor-pointer"
                        >
                          {post.category.name}
                        </Badge>
                      </Link>
                    </div>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm sm:text-base font-semibold mb-3 text-foreground">
                        Tags:
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag: any) => (
                          <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                            <Badge
                              variant="outline"
                              className="hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-colors cursor-pointer"
                            >
                              {tag.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-border">
                    {post.author?.name && (
                      <div className="text-sm text-muted-foreground">
                        <p>
                          Written by{' '}
                          <span className="font-semibold text-foreground">
                            {post.author.name}
                          </span>
                        </p>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      Last updated:{' '}
                      {new Date(post.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </footer>

                {relatedPosts.length > 0 && (
                  <section className="mt-12 sm:mt-16 pt-12 sm:pt-16 border-t border-border">
                    <div className="mb-6 sm:mb-8">
                      <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">
                        Related Articles
                      </h2>
                      <p className="text-muted-foreground">
                        Continue reading with these related articles
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                      {relatedPosts.map((relatedPost: any) => (
                        <Link
                          key={relatedPost.id}
                          href={`/blog/${relatedPost.slug}`}
                          className="group block"
                        >
                          <article className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 bg-card">
                            {relatedPost.featured_image && (
                              <div className="relative w-full h-40 sm:h-48">
                                <Image
                                  src={relatedPost.featured_image}
                                  alt={relatedPost.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                  unoptimized
                                />
                              </div>
                            )}
                            <div className="p-4 sm:p-6">
                              {relatedPost.category && (
                                <Badge
                                  variant="secondary"
                                  className="mb-2 sm:mb-3 text-xs"
                                >
                                  {relatedPost.category.name}
                                </Badge>
                              )}
                              <h3 className="font-semibold text-base sm:text-lg mb-2 group-hover:text-orange-600 transition-colors line-clamp-2 text-foreground">
                                {relatedPost.title}
                              </h3>
                              {relatedPost.excerpt && (
                                <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 leading-relaxed">
                                  {relatedPost.excerpt}
                                </p>
                              )}
                            </div>
                          </article>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {suggestedProducts.length > 0 && (
                  <RelatedProductsSection
                    products={suggestedProducts}
                    title="Shop Related Products"
                    description="Discover products related to this article"
                  />
                )}
              </div>
            </article>

            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-6 pt-8 lg:pt-0">
                <TableOfContents content={processedContent || postContent} />
                <AuthorCard
                  author={post.author}
                  readingTime={post.reading_time}
                  viewsCount={post.views_count}
                />
                <SidebarTrustSignals />
              </div>
            </aside>
          </div>
        </div>

        <NewsletterLazy />
      </div>
    </>
  )
}
