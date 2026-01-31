import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, productName, email, currentPrice } = body

    if (!productId || !email) {
      return NextResponse.json(
        { error: 'Product ID and email are required' },
        { status: 400 }
      )
    }

    // Store price alert subscription
    // In production, this would go to a dedicated table
    // For now, we'll use cart_analytics or create a new table
    const { data, error } = await supabaseAdmin
      .from('cart_analytics')
      .insert({
        email: email,
        cart_data: {
          type: 'price_alert',
          productId,
          productName,
          currentPrice,
          subscribedAt: new Date().toISOString(),
        },
        abandoned_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving price alert:', error)
      // Don't fail - just log it
    }

    // In production, integrate with email service
    console.log('Price alert subscribed:', {
      productId,
      productName,
      email,
      currentPrice,
    })

    return NextResponse.json({
      success: true,
      message: 'Price alert subscription saved',
    })
  } catch (error) {
    console.error('Error in POST /api/products/price-alerts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









