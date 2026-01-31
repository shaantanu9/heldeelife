import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET /api/addresses - Get user's addresses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: addresses, error } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('user_id', session.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching addresses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch addresses' },
        { status: 500 }
      )
    }

    return NextResponse.json({ addresses: addresses || [] })
  } catch (error) {
    console.error('Error in GET /api/addresses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/addresses - Create new address
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      is_default,
      name,
      phone,
      email,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      zip_code,
      country,
      landmark,
      building_name,
      floor,
      unit,
      instructions,
      latitude,
      longitude,
    } = body

    // Validate required fields
    if (
      !name ||
      !phone ||
      !address_line1 ||
      !city ||
      !state ||
      (!pincode && !zip_code)
    ) {
      return NextResponse.json(
        {
          error:
            'Name, phone, address, city, state, and pincode/zip_code are required',
        },
        { status: 400 }
      )
    }

    // If setting as default, unset other default addresses
    if (is_default === true) {
      await supabaseAdmin
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', session.user.id)
    }

    const { data: address, error } = await supabaseAdmin
      .from('user_addresses')
      .insert({
        user_id: session.user.id,
        type: type || 'home',
        is_default: is_default || false,
        name,
        phone,
        email,
        address_line1,
        address_line2,
        city,
        state,
        pincode: pincode || null,
        zip_code: zip_code || null,
        country: country || 'India',
        landmark,
        building_name,
        floor,
        unit,
        instructions,
        latitude,
        longitude,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating address:', error)
      return NextResponse.json(
        { error: 'Failed to create address' },
        { status: 500 }
      )
    }

    return NextResponse.json({ address }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/addresses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
