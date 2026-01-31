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

    // For now, process each event individually
    // Use the request URL to determine the base URL
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`

    const results = await Promise.allSettled(
      events.map(async (event: any) => {
        try {
          const response = await fetch(`${baseUrl}/api/analytics/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
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

