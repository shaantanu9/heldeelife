import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET /api/products/inventory/alerts - Get inventory alerts (admin only)
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
    const alertType = searchParams.get('type')
    const resolved = searchParams.get('resolved')

    let query = supabaseAdmin
      .from('inventory_alerts')
      .select(
        `
        *,
        products (
          id,
          name,
          sku
        ),
        inventory (
          id,
          location,
          available_quantity
        )
      `
      )
      .order('created_at', { ascending: false })

    if (alertType) {
      query = query.eq('alert_type', alertType)
    }

    if (resolved === 'true') {
      query = query.eq('is_resolved', true)
    } else if (resolved === 'false') {
      query = query.eq('is_resolved', false)
    }

    const { data: alerts, error } = await query

    if (error) {
      console.error('Error fetching inventory alerts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch alerts' },
        { status: 500 }
      )
    }

    return NextResponse.json({ alerts: alerts || [] })
  } catch (error) {
    console.error('Error in GET /api/products/inventory/alerts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









