import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET /api/blog/categories - Get all categories
export async function GET() {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('blog_categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error in GET /api/blog/categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/blog/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create categories
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, slug, description } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const { data: category, error } = await supabaseAdmin
      .from('blog_categories')
      .insert({ name, slug, description })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      )
    }

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/blog/categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
