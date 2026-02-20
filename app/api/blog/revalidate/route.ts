import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

/** Allowed path patterns for revalidation: /blog, /blog/<slug>, /sitemap.xml, /rss.xml */
const ALLOWED_PATH_PATTERN =
  /^\/(blog(\/[a-zA-Z0-9_-]+)?|sitemap\.xml|rss\.xml)$/
/** Slug: alphanumeric, hyphens, underscores only */
const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/

/**
 * On-demand revalidation API (admin only)
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
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const slug =
      typeof body?.slug === 'string' ? body.slug.trim() : undefined
    const path =
      typeof body?.path === 'string' ? body.path.trim() : undefined

    if (slug) {
      if (!SLUG_PATTERN.test(slug)) {
        return NextResponse.json(
          { error: 'Invalid slug: only letters, numbers, hyphens and underscores allowed' },
          { status: 400 }
        )
      }
      revalidatePath(`/blog/${slug}`)
      revalidatePath('/blog')
      revalidateTag(`blog-${slug}`, 'page')
    } else if (path) {
      if (!ALLOWED_PATH_PATTERN.test(path)) {
        return NextResponse.json(
          { error: 'Invalid path: only /blog, /blog/<slug>, /sitemap.xml, /rss.xml allowed' },
          { status: 400 }
        )
      }
      revalidatePath(path)
    } else {
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









