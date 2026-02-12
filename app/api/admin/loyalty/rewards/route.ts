import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createCachedResponse } from '@/lib/utils/cache-headers'
import { REVALIDATE_TIMES } from '@/lib/constants'


// GET /api/admin/loyalty/rewards - Get loyalty rewards (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: rewards, error } = await supabaseAdmin
      .from('loyalty_rewards')
      .select('*')
      .order('points_required', { ascending: true })

    if (error) {
      console.error('Error fetching loyalty rewards:', error)
      return NextResponse.json(
        { error: 'Failed to fetch loyalty rewards' },
        { status: 500 }
      )
    }

    // Cache loyalty rewards for 30 minutes (rewards rarely change)
    return createCachedResponse(
      { rewards: rewards || [] },
      {
        public: false,
        maxAge: REVALIDATE_TIMES.loyaltyRewards, // 30 minutes
        staleWhileRevalidate: 1800, // 30 minutes
        mustRevalidate: false,
      }
    )
  } catch (error) {
    console.error('Error in GET /api/admin/loyalty/rewards:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
