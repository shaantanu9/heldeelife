import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET /api/addresses/[id] - Get single address
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: address, error } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      console.error('Error fetching address:', error)
      return NextResponse.json(
        { error: 'Failed to fetch address' },
        { status: 500 }
      )
    }

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    return NextResponse.json({ address })
  } catch (error) {
    console.error('Error in GET /api/addresses/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/addresses/[id] - Update address
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        .neq('id', params.id)
    }

    const { data: address, error } = await supabaseAdmin
      .from('user_addresses')
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating address:', error)
      return NextResponse.json(
        { error: 'Failed to update address' },
        { status: 500 }
      )
    }

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    return NextResponse.json({ address })
  } catch (error) {
    console.error('Error in PUT /api/addresses/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/addresses/[id] - Delete address
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabaseAdmin
      .from('user_addresses')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error deleting address:', error)
      return NextResponse.json(
        { error: 'Failed to delete address' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/addresses/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/addresses/[id] - Set as default address
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { is_default } = body

    // If setting as default, unset other default addresses
    if (is_default === true) {
      await supabaseAdmin
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', session.user.id)
        .neq('id', params.id)
    }

    const { data: address, error } = await supabaseAdmin
      .from('user_addresses')
      .update({
        is_default: is_default || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating address:', error)
      return NextResponse.json(
        { error: 'Failed to update address' },
        { status: 500 }
      )
    }

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    return NextResponse.json({ address })
  } catch (error) {
    console.error('Error in PATCH /api/addresses/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
