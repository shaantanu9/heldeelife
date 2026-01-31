import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET /api/payments/methods - Get user payment methods
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: methods, error } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('user_id', session.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payment methods:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payment methods' },
        { status: 500 }
      )
    }

    return NextResponse.json({ methods: methods || [] })
  } catch (error) {
    console.error('Error in GET /api/payments/methods:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/payments/methods - Add payment method
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      card_number,
      expiry_month,
      expiry_year,
      cardholder_name,
      upi_id,
      provider,
    } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Payment type is required' },
        { status: 400 }
      )
    }

    // Prepare payment method data
    const paymentMethodData: any = {
      user_id: session.user.id,
      type,
      provider: provider || '',
      is_default: false,
    }

    if (type === 'card') {
      if (!card_number || !expiry_month || !expiry_year || !cardholder_name) {
        return NextResponse.json(
          { error: 'All card details are required' },
          { status: 400 }
        )
      }
      paymentMethodData.last_four = card_number.slice(-4)
      paymentMethodData.expiry_month = parseInt(expiry_month)
      paymentMethodData.expiry_year = parseInt(expiry_year)
      paymentMethodData.cardholder_name = cardholder_name
      // In production, encrypt card details and store securely
    } else if (type === 'upi') {
      if (!upi_id) {
        return NextResponse.json(
          { error: 'UPI ID is required' },
          { status: 400 }
        )
      }
      paymentMethodData.provider = upi_id
    } else {
      if (!provider) {
        return NextResponse.json(
          { error: 'Provider is required' },
          { status: 400 }
        )
      }
      paymentMethodData.provider = provider
    }

    // If this is the first payment method, set it as default
    const { data: existingMethods } = await supabaseAdmin
      .from('payment_methods')
      .select('id')
      .eq('user_id', session.user.id)
      .limit(1)

    if (!existingMethods || existingMethods.length === 0) {
      paymentMethodData.is_default = true
    }

    const { data: method, error } = await supabaseAdmin
      .from('payment_methods')
      .insert(paymentMethodData)
      .select()
      .single()

    if (error) {
      console.error('Error creating payment method:', error)
      return NextResponse.json(
        { error: 'Failed to add payment method' },
        { status: 500 }
      )
    }

    return NextResponse.json({ method })
  } catch (error) {
    console.error('Error in POST /api/payments/methods:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









