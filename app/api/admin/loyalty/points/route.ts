import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createCachedResponse } from '@/lib/utils/cache-headers'
import { REVALIDATE_TIMES } from '@/lib/constants'


// GET /api/admin/loyalty/points - Get loyalty points (admin only)
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
    const tier = searchParams.get('tier')
    const search = searchParams.get('search')

    let query = supabaseAdmin
      .from('loyalty_points')
      .select(
        `
        *,
        users:user_id (
          email,
          full_name
        )
      `
      )
      .order('lifetime_points', { ascending: false })

    if (tier && tier !== 'all') {
      query = query.eq('tier', tier)
    }

    const { data: points, error } = await query

    if (error) {
      console.error('Error fetching loyalty points:', error)
      return NextResponse.json(
        { error: 'Failed to fetch loyalty points' },
        { status: 500 }
      )
    }

    // Format points with user info and filter by search
    let formattedPoints = (points || []).map((point: any) => ({
      id: point.id,
      user_id: point.user_id,
      user_email: point.users?.email,
      user_name: point.users?.full_name,
      points: point.points,
      lifetime_points: point.lifetime_points,
      tier: point.tier,
      tier_expires_at: point.tier_expires_at,
      created_at: point.created_at,
      updated_at: point.updated_at,
    }))

    // Apply search filter
    if (search) {
      formattedPoints = formattedPoints.filter(
        (p) =>
          p.user_email?.toLowerCase().includes(search.toLowerCase()) ||
          p.user_name?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Cache loyalty points for 5 minutes (admin-only, private cache)
    return createCachedResponse(
      { points: formattedPoints },
      {
        public: false,
        maxAge: REVALIDATE_TIMES.loyaltyPoints, // 5 minutes
        staleWhileRevalidate: 300, // 5 minutes
        mustRevalidate: false,
      }
    )
  } catch (error) {
    console.error('Error in GET /api/admin/loyalty/points:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
