import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { events } = body

    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid events array' }, { status: 400 })
    }

    // Process events in batch
    // In a production app, you might want to:
    // 1. Store in a queue (Redis, SQS)
    // 2. Process asynchronously
    // 3. Aggregate before storing in database

    // For now, process each event individually.
    // Use the incoming request origin so batch runs on the same host (avoids
    // localhost calling heldeelife.com and timing out in dev).
    const baseUrl =
      request.nextUrl.origin ||
      (typeof process.env.NEXT_PUBLIC_SITE_URL === 'string' &&
        process.env.NEXT_PUBLIC_SITE_URL.trim() !== ''
        ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
        : null) ||
      'http://localhost:3000'

    const results = await Promise.allSettled(
      events.map(async (event: Record<string, unknown>) => {
        try {
          const response = await fetch(`${baseUrl}/api/analytics/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
            signal: AbortSignal.timeout(8000),
          })
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
        } catch (error) {
          console.error('Error processing batch event:', error)
          // Don't throw - continue processing other events
        }
      })
    )

    const successCount = results.filter((r) => r.status === 'fulfilled').length

    return NextResponse.json({
      success: true,
      processed: successCount,
      total: events.length,
    })
  } catch (error) {
    console.error('Error processing batch analytics:', error)
    return NextResponse.json({ error: 'Failed to process batch' }, { status: 500 })
  }
}

