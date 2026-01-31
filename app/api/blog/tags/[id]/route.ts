import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// PUT /api/blog/tags/[id] - Update tag (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, slug } = body

    const { data: tag, error } = await supabaseAdmin
      .from('blog_tags')
      .update({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating tag:', error)
      return NextResponse.json(
        { error: 'Failed to update tag' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tag })
  } catch (error) {
    console.error('Error in PUT /api/blog/tags/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/blog/tags/[id] - Delete tag (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { error } = await supabaseAdmin
      .from('blog_tags')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting tag:', error)
      return NextResponse.json(
        { error: 'Failed to delete tag' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/blog/tags/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
