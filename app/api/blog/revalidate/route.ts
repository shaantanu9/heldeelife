import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

/**
 * On-demand revalidation API
 * Call this after publishing/updating a blog post to instantly update static pages
 *
 * Usage:
 * POST /api/blog/revalidate
 * Body: { slug?: string, path?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { slug, path } = body

    if (slug) {
      // Revalidate specific blog post
      revalidatePath(`/blog/${slug}`)
      revalidatePath('/blog')
      revalidateTag(`blog-${slug}`, 'page')
    } else if (path) {
      // Revalidate specific path
      revalidatePath(path)
    } else {
      // Revalidate all blog pages
      revalidatePath('/blog')
      revalidatePath('/blog/[slug]', 'page')
    }

    // Also revalidate sitemap and RSS
    revalidatePath('/sitemap.xml')
    revalidatePath('/rss.xml')

    return NextResponse.json({
      revalidated: true,
      message: slug
        ? `Revalidated blog post: ${slug}`
        : 'Revalidated blog pages',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error revalidating:', error)
    return NextResponse.json({ error: 'Error revalidating' }, { status: 500 })
  }
}









