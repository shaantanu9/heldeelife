import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { UpdateBlogPostInput } from '@/lib/types/blog'
import {
  calculateReadingTime,
  calculateSEOScore,
  extractExcerpt,
} from '@/lib/utils/blog'
import { sanitizeBlogContent } from '@/lib/utils/blog-content'

// GET /api/blog/posts/[id] - Get a single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    let query = supabaseAdmin
      .from('blog_posts')
      .select(
        `
        *,
        category:blog_categories(*),
        tags:blog_post_tags(
          tag:blog_tags(*)
        )
      `
      )
      .eq('id', id)

    // If not authenticated, only show published posts
    if (!session) {
      query = query.eq('status', 'published')
    }

    const { data: post, error } = await query.single()

    if (error) {
      console.error('Error fetching blog post:', error)
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Transform tags data
    const transformedPost = {
      ...post,
      tags: post.tags?.map((pt: any) => pt.tag) || [],
    }

    // Increment views count for published posts
    if (post.status === 'published') {
      await supabaseAdmin
        .from('blog_posts')
        .update({ views_count: (post.views_count || 0) + 1 })
        .eq('id', id)
    }

    return NextResponse.json({ post: transformedPost })
  } catch (error) {
    console.error('Error in GET /api/blog/posts/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/blog/posts/[id] - Update a blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can update blog posts
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body: Partial<UpdateBlogPostInput> = await request.json()

    // Check if user owns the post
    const { data: existingPost, error: checkError } = await supabaseAdmin
      .from('blog_posts')
      .select('author_id, published_at')
      .eq('id', id)
      .single()

    if (checkError || !existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    if (existingPost.author_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.content !== undefined) {
      // Ensure content is a string
      const contentString =
        typeof body.content === 'string'
          ? body.content
          : String(body.content || '')

      // Sanitize content before saving
      const sanitizedContent = sanitizeBlogContent(contentString)
      updateData.content = sanitizedContent
      updateData.reading_time = calculateReadingTime(sanitizedContent)
      if (!body.excerpt) {
        updateData.excerpt = extractExcerpt(sanitizedContent)
      }
    }
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt
    if (body.featured_image !== undefined)
      updateData.featured_image = body.featured_image
    if (body.category_id !== undefined)
      updateData.category_id = body.category_id || null
    if (body.status !== undefined) {
      updateData.status = body.status
      if (body.status === 'published' && !existingPost.published_at) {
        updateData.published_at = body.published_at || new Date().toISOString()
      }
    }
    if (body.published_at !== undefined)
      updateData.published_at = body.published_at
    if (body.meta_title !== undefined) updateData.meta_title = body.meta_title
    if (body.meta_description !== undefined)
      updateData.meta_description = body.meta_description
    if (body.meta_keywords !== undefined)
      updateData.meta_keywords = body.meta_keywords

    // Recalculate SEO score
    const { data: currentPost } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (currentPost) {
      const updatedPost = { ...currentPost, ...updateData }
      updateData.seo_score = calculateSEOScore(updatedPost)
    }

    // Update the blog post
    const { data: post, error: updateError } = await supabaseAdmin
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating blog post:', updateError)
      return NextResponse.json(
        { error: 'Failed to update blog post' },
        { status: 500 }
      )
    }

    // Trigger revalidation if post is published
    if (updateData.status === 'published' || post.status === 'published') {
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

    // Update tags if provided
    if (body.tag_ids !== undefined) {
      // Delete existing tags
      await supabaseAdmin.from('blog_post_tags').delete().eq('post_id', id)

      // Add new tags
      if (body.tag_ids.length > 0) {
        const tagRelations = body.tag_ids.map((tag_id) => ({
          post_id: id,
          tag_id,
        }))

        const { error: tagError } = await supabaseAdmin
          .from('blog_post_tags')
          .insert(tagRelations)

        if (tagError) {
          console.error('Error updating tags:', tagError)
        }
      }
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error in PUT /api/blog/posts/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/blog/posts/[id] - Delete a blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete blog posts
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if post exists
    const { data: existingPost, error: checkError } = await supabaseAdmin
      .from('blog_posts')
      .select('author_id')
      .eq('id', id)
      .single()

    if (checkError || !existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Delete the blog post (cascade will handle tags)
    const { error: deleteError } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting blog post:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete blog post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/blog/posts/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
