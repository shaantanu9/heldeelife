import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { normalizePhoneNumber } from '@/lib/auth-utils'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone } = body

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Normalize phone number if provided
    const phoneNumber = phone ? normalizePhoneNumber(phone) : null

    // Update user metadata in Supabase Auth
    const updateData: any = {
      data: {
        full_name: name,
      },
    }

    if (phoneNumber) {
      updateData.data.phone_number = phoneNumber
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      session.user.id,
      updateData
    )

    if (authError) {
      console.error('Error updating auth user:', authError)
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    // Update user profile in users table
    const updateProfile: any = {
      full_name: name,
      updated_at: new Date().toISOString(),
    }

    if (phoneNumber) {
      updateProfile.phone_number = phoneNumber
    }

    const { error: profileError } = await supabaseAdmin
      .from('users')
      .update(updateProfile)
      .eq('id', session.user.id)

    if (profileError) {
      console.error('Error updating user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        name,
        phone: phoneNumber,
      },
    })
  } catch (error) {
    console.error('Error in PUT /api/auth/update-profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









