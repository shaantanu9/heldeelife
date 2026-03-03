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
    const { data, error } = await supabaseAdmin
      .from('ab_experiment_events')
      .select('variant_id, event_type')

    if (error) {
      console.error('Error fetching ab events:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Aggregate counts grouped by variant_id and event_type
    const results: Record<string, Record<string, number>> = {}
    for (const row of data || []) {
      if (!results[row.variant_id]) results[row.variant_id] = {}
      results[row.variant_id][row.event_type] = (results[row.variant_id][row.event_type] || 0) + 1
    }

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
