import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'

const VALID_VARIANT_IDS = ['control', 'benefit', 'urgency', 'social'] as const
const VALID_EVENT_TYPES = ['variant_shown', 'cta_clicked', 'purchase_completed'] as const

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 100 A/B events per minute per IP
    const ip = getRateLimitIdentifier(request)
    const rateLimitResult = await rateLimit(`ab-events:${ip}`, 100, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { variant_id, event_type, session_id, metadata } = body

    if (!variant_id || !VALID_VARIANT_IDS.includes(variant_id)) {
      return NextResponse.json({ error: 'Invalid variant_id' }, { status: 400 })
    }

    if (!event_type || !VALID_EVENT_TYPES.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })
    }

    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('ab_experiment_events').insert({
      session_id,
      variant_id,
      event_type,
      metadata: metadata || {},
    })

    if (error) {
      console.error('Error inserting ab event:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
