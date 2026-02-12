import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = parseInt(searchParams.get('period') || '30') // days

    // Calculate date range
    const end = new Date()
    const start = new Date(end.getTime() - period * 24 * 60 * 60 * 1000)

    // Get all blog posts
    const { data: posts, error: postsError } = await supabaseAdmin
      .from('blog_posts')
      .select('id, title, status, views_count, seo_score, reading_time, created_at, published_at, category_id')
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return NextResponse.json(
        { error: 'Failed to fetch blog analytics' },
        { status: 500 }
      )
    }

    // Get categories
    const { data: categories } = await supabaseAdmin
      .from('blog_categories')
      .select('id, name, slug')

    // Get tags
    const { data: tags } = await supabaseAdmin
      .from('blog_tags')
      .select('id, name, slug')

    // Get post-tag relationships
    const { data: postTags } = await supabaseAdmin
      .from('blog_post_tags')
      .select('post_id, tag_id')

    // Calculate statistics
    const totalPosts = posts?.length || 0
    const publishedPosts = posts?.filter((p) => p.status === 'published').length || 0
    const draftPosts = posts?.filter((p) => p.status === 'draft').length || 0
    const archivedPosts = posts?.filter((p) => p.status === 'archived').length || 0

    const totalViews = posts?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0
    const averageViews = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0

    const seoScores = posts?.map((p) => p.seo_score || 0).filter((s) => s > 0) || []
    const averageSeoScore =
      seoScores.length > 0
        ? Math.round(seoScores.reduce((sum, s) => sum + s, 0) / seoScores.length)
        : 0

    const readingTimes = posts?.map((p) => p.reading_time || 0).filter((t) => t > 0) || []
    const averageReadingTime =
      readingTimes.length > 0
        ? Math.round(readingTimes.reduce((sum, t) => sum + t, 0) / readingTimes.length)
        : 0

    // Top posts by views
    const topPosts = posts
      ?.filter((p) => p.status === 'published')
      .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        title: p.title,
        views: p.views_count || 0,
        seo_score: p.seo_score || 0,
        slug: p.title.toLowerCase().replace(/\s+/g, '-'),
      })) || []

    // Posts needing SEO improvement (SEO score < 70)
    const lowSeoPosts = posts
      ?.filter((p) => (p.seo_score || 0) < 70 && p.status === 'published')
      .sort((a, b) => (a.seo_score || 0) - (b.seo_score || 0))
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        title: p.title,
        seo_score: p.seo_score || 0,
        slug: p.title.toLowerCase().replace(/\s+/g, '-'),
      })) || []

    // Category statistics
    const categoryMap = new Map(categories?.map((c) => [c.id, c]) || [])
    const categoryStats = Array.from(categoryMap.values()).map((category) => {
      const categoryPosts = posts?.filter((p) => p.category_id === category.id) || []
      const categoryViews = categoryPosts.reduce(
        (sum, p) => sum + (p.views_count || 0),
        0
      )
      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        count: categoryPosts.length,
        views: categoryViews,
      }
    })

    // Tag statistics
    const tagMap = new Map(tags?.map((t) => [t.id, t]) || [])
    const tagStats = Array.from(tagMap.values()).map((tag) => {
      const tagPostIds = postTags
        ?.filter((pt) => pt.tag_id === tag.id)
        .map((pt) => pt.post_id) || []
      const tagPosts = posts?.filter((p) => tagPostIds.includes(p.id)) || []
      return {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        count: tagPosts.length,
      }
    })

    // Views over time (last 30 days)
    const viewsOverTime: Array<{ date: string; views: number }> = []
    for (let i = period - 1; i >= 0; i--) {
      const date = new Date(end.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      
      // For now, we'll use a simple calculation
      // In a real implementation, you'd track views per day
      const dayViews = Math.floor(Math.random() * 50) // Placeholder
      viewsOverTime.push({ date: dateStr, views: dayViews })
    }

    return NextResponse.json({
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
      totalViews,
      averageViews,
      averageSeoScore,
      averageReadingTime,
      topPosts,
      lowSeoPosts,
      categoryStats: categoryStats.sort((a, b) => b.views - a.views),
      tagStats: tagStats.sort((a, b) => b.count - a.count),
      viewsOverTime,
    })
  } catch (error) {
    console.error('Error in blog analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






