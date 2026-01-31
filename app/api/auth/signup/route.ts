import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  toEmailFormat,
  extractPhoneFromEmail,
  normalizePhoneNumber,
  isValidInput,
} from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailOrPhone, password, fullName } = body

    // Validate input
    if (!emailOrPhone || !password) {
      return NextResponse.json(
        { error: 'Email/Phone and password are required' },
        { status: 400 }
      )
    }

    if (!isValidInput(emailOrPhone)) {
      return NextResponse.json(
        { error: 'Invalid email or phone number format' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Convert phone number to email format if needed
    const email = toEmailFormat(emailOrPhone)
    const phoneNumber = extractPhoneFromEmail(email)
      ? normalizePhoneNumber(emailOrPhone)
      : null

    // Sign up with Supabase
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || null,
            phone_number: phoneNumber,
          },
        },
      })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create user profile in users table with default 'user' role
    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email: email,
      phone_number: phoneNumber,
      full_name: fullName || null,
      role: 'user', // Default role for new users
    })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't fail the signup if profile creation fails, but log it
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      message:
        'Account created successfully. Please check your email to verify your account.',
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred during signup' },
      { status: 500 }
    )
  }
}
