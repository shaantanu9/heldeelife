import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // SQL GROUP BY aggregation via stored function (avoids fetching all rows into JS)
    const { data, error } = await supabaseAdmin.rpc('get_ab_event_counts')

    if (error) {
      console.error('Error fetching ab events:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Transform flat rows into nested { variant_id: { event_type: count } }
    const results: Record<string, Record<string, number>> = {}
    for (const row of data || []) {
      if (!results[row.variant_id]) results[row.variant_id] = {}
      results[row.variant_id][row.event_type] = Number(row.count)
    }

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
