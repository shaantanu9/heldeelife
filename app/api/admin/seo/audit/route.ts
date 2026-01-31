import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

export const revalidate = 300 // Cache for 5 minutes

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const issues: Array<{
      type: 'error' | 'warning' | 'info'
      field: string
      message: string
      count: number
      items?: Array<{ id: string; title: string; url: string }>
    }> = []

    // Check blog posts for missing meta descriptions
    const { data: postsWithoutMeta } = await supabaseAdmin
      .from('blog_posts')
      .select('id, title, slug, status')
      .eq('status', 'published')
      .or('meta_description.is.null,meta_description.eq.')

    if (postsWithoutMeta && postsWithoutMeta.length > 0) {
      issues.push({
        type: 'warning',
        field: 'Missing Meta Descriptions',
        message: `${postsWithoutMeta.length} published posts are missing meta descriptions`,
        count: postsWithoutMeta.length,
        items: postsWithoutMeta.map((p) => ({
          id: p.id,
          title: p.title,
          url: `/admin/blog/${p.id}`,
        })),
      })
    }

    // Check blog posts with low SEO scores
    const { data: lowSeoPosts } = await supabaseAdmin
      .from('blog_posts')
      .select('id, title, slug, seo_score, status')
      .eq('status', 'published')
      .lt('seo_score', 70)

    if (lowSeoPosts && lowSeoPosts.length > 0) {
      issues.push({
        type: 'warning',
        field: 'Low SEO Scores',
        message: `${lowSeoPosts.length} published posts have SEO scores below 70`,
        count: lowSeoPosts.length,
        items: lowSeoPosts.map((p) => ({
          id: p.id,
          title: `${p.title} (Score: ${p.seo_score})`,
          url: `/admin/blog/${p.id}`,
        })),
      })
    }

    // Check products for missing meta descriptions
    const { data: productsWithoutMeta } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, is_active')
      .eq('is_active', true)
      .or('meta_description.is.null,meta_description.eq.')

    if (productsWithoutMeta && productsWithoutMeta.length > 0) {
      issues.push({
        type: 'info',
        field: 'Products Missing Meta Descriptions',
        message: `${productsWithoutMeta.length} active products are missing meta descriptions`,
        count: productsWithoutMeta.length,
        items: productsWithoutMeta.slice(0, 10).map((p) => ({
          id: p.id,
          title: p.name,
          url: `/admin/products/${p.id}`,
        })),
      })
    }

    // Check for posts without featured images
    const { data: postsWithoutImages } = await supabaseAdmin
      .from('blog_posts')
      .select('id, title, slug, status')
      .eq('status', 'published')
      .or('featured_image.is.null,featured_image.eq.')

    if (postsWithoutImages && postsWithoutImages.length > 0) {
      issues.push({
        type: 'warning',
        field: 'Missing Featured Images',
        message: `${postsWithoutImages.length} published posts are missing featured images`,
        count: postsWithoutImages.length,
        items: postsWithoutImages.map((p) => ({
          id: p.id,
          title: p.title,
          url: `/admin/blog/${p.id}`,
        })),
      })
    }

    // Calculate overall score
    const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0)
    const errors = issues.filter((i) => i.type === 'error').length
    const warnings = issues.filter((i) => i.type === 'warning').length

    // Score calculation: 100 - (errors * 10) - (warnings * 5) - (info * 1)
    const overallScore = Math.max(
      0,
      100 - errors * 10 - warnings * 5 - (issues.length - errors - warnings) * 1
    )

    return NextResponse.json({
      overallScore,
      totalIssues,
      errors,
      warnings,
      issues,
    })
  } catch (error) {
    console.error('Error in SEO audit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






