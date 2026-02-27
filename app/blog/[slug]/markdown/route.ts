import { NextRequest, NextResponse } from 'next/server'
import { getBlogPostOptimized } from '@/lib/utils/blog-query'
import { buildBlogMarkdownDocument } from '@/lib/utils/blog-content'

/**
 * Serves the blog post as Markdown so parsers and LLMs can fetch and use it.
 * Response includes a canonical link to the actual blog page for ranking and indexing.
 *
 * URL: /blog/[slug]/markdown
 * Headers: Content-Type: text/markdown, Link: <canonical>; rel="canonical"
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const post = await getBlogPostOptimized(slug)

  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://www.heldeelife.com'
  const canonical = `${baseUrl}/blog/${post.slug}`

  const markdown = buildBlogMarkdownDocument(
    {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content || '',
      published_at: post.published_at,
      updated_at: post.updated_at,
    },
    baseUrl
  )

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      Link: `<${canonical}>; rel="canonical"`,
      'X-Robots-Tag': 'index, follow',
    },
  })
}
