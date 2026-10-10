import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { toEmailFormat } from '@/lib/auth-utils'

// Rate limiting: Maximum 5 reset attempts per email per 24 hours
const MAX_RESET_ATTEMPTS_PER_24H = 5

// Helper function to get client IP address
function getClientIP(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return null
}

/**
 * Look up a user id by email for audit logging. Uses public.users (which
 * mirrors auth.users ids/emails); `auth.users` is not reachable through
 * PostgREST and admin.listUsers() is paginated, so neither is used.
 */
async function findUserIdByEmail(email: string): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    return (data?.id as string | undefined) ?? null
  } catch (error) {
    console.error('Error finding user for logging:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { emailOrPhone } = await request.json()

    if (!emailOrPhone) {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      )
    }

    // Convert phone number to email format if needed
    const email = toEmailFormat(emailOrPhone)

    // Get client information for logging
    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || null

    // Check rate limiting using database function
    const { data: recentAttempts, error: rateLimitError } =
      await supabaseAdmin.rpc('get_recent_reset_attempts', {
        p_email: email,
        p_hours: 24,
      })

    if (
      !rateLimitError &&
      recentAttempts &&
      recentAttempts >= MAX_RESET_ATTEMPTS_PER_24H
    ) {
      // Still log the attempt but don't send email
      try {
        const userId = await findUserIdByEmail(email)

        await supabaseAdmin.rpc('log_password_reset_attempt', {
          p_user_id: userId,
          p_email: email,
          p_ip_address: ipAddress,
          p_user_agent: userAgent,
          p_status: 'failed',
          p_expires_at: null,
        })
      } catch (logError) {
        // Silently fail logging - don't reveal rate limit
        console.error('Error logging rate-limited attempt:', logError)
      }

      // Return same message as success (security best practice)
      return NextResponse.json(
        {
          message:
            'If an account exists with this email or phone number, a password reset link has been sent.',
        },
        { status: 200 }
      )
    }

    // Get the site URL for the reset link
    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      'http://localhost:3000'
    ).replace(/\/+$/, '')

    // Generate password reset link using Supabase. resetPasswordForEmail does
    // not create a session, so it is safe on the shared admin client.
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/reset-password`,
    })

    // Try to find user_id for logging (never revealed to the caller)
    const userId = await findUserIdByEmail(email)

    // Log the password reset attempt
    try {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1) // Token expires in 1 hour

      await supabaseAdmin.rpc('log_password_reset_attempt', {
        p_user_id: userId,
        p_email: email,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_status: error ? 'failed' : 'requested',
        p_expires_at: expiresAt.toISOString(),
      })
    } catch (logError) {
      // Log error but don't fail the request
      console.error('Error logging password reset attempt:', logError)
    }

    if (error) {
      console.error('Password reset error:', error)
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        {
          message:
            'If an account exists with this email or phone number, a password reset link has been sent.',
        },
        { status: 200 }
      )
    }

    // Always return success message (security best practice)
    return NextResponse.json(
      {
        message:
          'If an account exists with this email or phone number, a password reset link has been sent.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in forgot-password route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
