import { NextRequest, NextResponse } from 'next/server'
import { getInsightsPosts } from '@/lib/utils/insights-query'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '12', 10)

    const posts = await getInsightsPosts(limit)

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error in GET /api/insights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









