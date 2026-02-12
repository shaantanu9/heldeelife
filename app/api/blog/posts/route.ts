import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { BlogPost, CreateBlogPostInput } from '@/lib/types/blog'
import {
  calculateReadingTime,
  calculateSEOScore,
  extractExcerpt,
} from '@/lib/utils/blog'
import { sanitizeBlogContent } from '@/lib/utils/blog-content'

// Route segment config for caching
export const dynamic = 'force-dynamic'

// GET /api/blog/posts - Get all published posts (public) or all posts for authenticated users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin.from('blog_posts').select(`
        *,
        category:blog_categories(*),
        tags:blog_post_tags(
          tag:blog_tags(*)
        )
      `)

    // If not authenticated, only show published posts
    if (!session) {
      query = query
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
    } else if (status && status !== 'all') {
      // Filter by specific status
      query = query
        .eq('status', status)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
    } else {
      // Show all posts (for admin with status=all or no status param)
      // Order by created_at first for drafts, then by published_at for published posts
      query = query.order('created_at', { ascending: false })
    }

    // Filter by category
    if (category) {
      query = query.eq('category_id', category)
    }

    // Filter by tag
    if (tag) {
      query = query.contains('tags', [{ tag_id: tag }])
    }

    const { data, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching blog posts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch blog posts' },
        { status: 500 }
      )
    }

    // Transform tags data
    const posts = (data || []).map((post: any) => ({
      ...post,
      tags: post.tags?.map((pt: any) => pt.tag) || [],
    }))

    const response = NextResponse.json({ posts, total: posts.length })

    // Set cache headers for public requests
    if (!session) {
      response.headers.set(
        'Cache-Control',
        'public, s-maxage=60, stale-while-revalidate=300'
      )
    }

    return response
  } catch (error) {
    console.error('Error in GET /api/blog/posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/blog/posts - Create a new blog post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create blog posts
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body: CreateBlogPostInput = await request.json()
    const {
      title,
      slug,
      content,
      excerpt,
      featured_image,
      category_id,
      status,
      published_at,
      meta_title,
      meta_description,
      meta_keywords,
      tag_ids,
    } = body

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      )
    }

    // Ensure content is a string
    const contentString =
      typeof content === 'string' ? content : String(content || '')

    // Sanitize content before saving
    const sanitizedContent = sanitizeBlogContent(contentString)

    // Calculate reading time and SEO score
    const reading_time = calculateReadingTime(sanitizedContent)
    const finalExcerpt = excerpt || extractExcerpt(sanitizedContent)
    const seo_score = calculateSEOScore({
      id: '',
      title,
      slug,
      excerpt: finalExcerpt,
      content: sanitizedContent, // Use sanitized content for SEO calculation
      featured_image,
      author_id: session.user.id,
      category_id: category_id || undefined,
      status: status || 'draft',
      published_at: published_at || undefined,
      meta_title,
      meta_description,
      meta_keywords,
      reading_time,
      views_count: 0,
      seo_score: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    // Create the blog post
    const { data: post, error: postError } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        title,
        slug,
        excerpt: finalExcerpt,
        content: sanitizedContent, // Use sanitized content
        featured_image,
        author_id: session.user.id,
        category_id: category_id || null,
        status: status || 'draft',
        published_at:
          status === 'published'
            ? published_at || new Date().toISOString()
            : null,
        meta_title: meta_title || title,
        meta_description: meta_description || finalExcerpt,
        meta_keywords: Array.isArray(meta_keywords)
          ? meta_keywords
          : typeof meta_keywords === 'string' && (meta_keywords as string).trim()
            ? (meta_keywords as string)
                .split(',')
                .map((k: string) => k.trim())
                .filter(Boolean)
            : [],
        reading_time,
        seo_score,
      })
      .select()
      .single()

    if (postError) {
      console.error('Error creating blog post:', postError)
      return NextResponse.json(
        { error: 'Failed to create blog post' },
        { status: 500 }
      )
    }

    // Add tags if provided
    if (tag_ids && tag_ids.length > 0) {
      const tagRelations = tag_ids.map((tag_id) => ({
        post_id: post.id,
        tag_id,
      }))

      const { error: tagError } = await supabaseAdmin
        .from('blog_post_tags')
        .insert(tagRelations)

      if (tagError) {
        console.error('Error adding tags:', tagError)
        // Don't fail the request, just log the error
      }
    }

    // Trigger revalidation if post is published
    if (status === 'published') {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/revalidate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: post.slug }),
          }
        )
      } catch (revalidateError) {
        // Don't fail the request if revalidation fails
        console.error('Revalidation error:', revalidateError)
      }
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/blog/posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
