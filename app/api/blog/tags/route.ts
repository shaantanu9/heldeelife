import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils/blog'

// GET /api/blog/tags - Get all tags
export async function GET() {
  try {
    const { data: tags, error } = await supabaseAdmin
      .from('blog_tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching tags:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tags' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error in GET /api/blog/tags:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/blog/tags - Create a new tag (or get existing)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create tags
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const slug = generateSlug(name)

    // Check if tag already exists
    const { data: existingTag } = await supabaseAdmin
      .from('blog_tags')
      .select('*')
      .eq('slug', slug)
      .single()

    if (existingTag) {
      return NextResponse.json({ tag: existingTag })
    }

    // Create new tag
    const { data: tag, error } = await supabaseAdmin
      .from('blog_tags')
      .insert({ name, slug })
      .select()
      .single()

    if (error) {
      console.error('Error creating tag:', error)
      return NextResponse.json(
        { error: 'Failed to create tag' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tag }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/blog/tags:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
