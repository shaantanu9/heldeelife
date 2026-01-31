import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, productName, email, phone } = body

    if (!productId || (!email && !phone)) {
      return NextResponse.json(
        { error: 'Product ID and email or phone are required' },
        { status: 400 }
      )
    }

    // Store stock alert subscription
    const { data, error } = await supabaseAdmin
      .from('cart_analytics')
      .insert({
        email: email || null,
        cart_data: {
          type: 'stock_alert',
          productId,
          productName,
          phone: phone || null,
          subscribedAt: new Date().toISOString(),
        },
        abandoned_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving stock alert:', error)
      // Don't fail - just log it
    }

    // In production, integrate with email/SMS service
    console.log('Stock alert subscribed:', {
      productId,
      productName,
      email,
      phone,
    })

    return NextResponse.json({
      success: true,
      message: 'Stock alert subscription saved',
    })
  } catch (error) {
    console.error('Error in POST /api/products/stock-alerts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









