import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET /api/wishlist - Get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: wishlist, error } = await supabaseAdmin
      .from('wishlist')
      .select(
        `
        *,
        products (
          id,
          name,
          slug,
          price,
          image,
          is_active
        )
      `
      )
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching wishlist:', error)
      return NextResponse.json(
        { error: 'Failed to fetch wishlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({ wishlist: wishlist || [] })
  } catch (error) {
    console.error('Error in GET /api/wishlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/wishlist - Add to wishlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { product_id } = body

    if (!product_id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Check if already in wishlist
    const { data: existing } = await supabaseAdmin
      .from('wishlist')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('product_id', product_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Product already in wishlist' },
        { status: 400 }
      )
    }

    const { data: wishlistItem, error } = await supabaseAdmin
      .from('wishlist')
      .insert({
        user_id: session.user.id,
        product_id,
      })
      .select(
        `
        *,
        products (
          id,
          name,
          slug,
          price,
          image
        )
      `
      )
      .single()

    if (error) {
      console.error('Error adding to wishlist:', error)
      return NextResponse.json(
        { error: 'Failed to add to wishlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({ wishlistItem }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/wishlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









