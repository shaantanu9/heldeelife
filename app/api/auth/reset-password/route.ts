import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 reset-password attempts per 10 minutes per IP
    const ip = getRateLimitIdentifier(request)
    const rateLimitResult = await rateLimit(`reset-password:${ip}`, 5, 600)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
            ),
          },
        }
      )
    }

    const { accessToken, password, attemptId } = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    if (typeof password !== 'string' || typeof accessToken !== 'string') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Verify the recovery access token WITHOUT creating a session on the
    // shared service-role client. (supabaseAdmin.auth.setSession/updateUser
    // would store this user's session on supabaseAdmin and make every later
    // server-side query run under the user's JWT.)
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(accessToken)

    if (userError || !userData?.user) {
      console.error('Reset token verification error:', userError)

      // Mark attempt as failed if we have attemptId
      if (attemptId) {
        try {
          await supabaseAdmin
            .from('password_reset_attempts')
            .update({
              status: 'failed',
              failure_reason: 'Invalid or expired token',
            })
            .eq('id', attemptId)
        } catch (logError) {
          console.error('Error updating attempt status:', logError)
        }
      }

      return NextResponse.json(
        {
          error:
            'Invalid or expired reset token. Please request a new password reset link.',
        },
        { status: 400 }
      )
    }

    const userId = userData.user.id

    // Update the user's password via the admin API (no session involved)
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, { password })

    if (updateError) {
      console.error('Password update error:', updateError)

      // Mark attempt as failed if we have attemptId
      if (attemptId) {
        try {
          await supabaseAdmin
            .from('password_reset_attempts')
            .update({
              status: 'failed',
              failure_reason: updateError.message || 'Password update failed',
            })
            .eq('id', attemptId)
        } catch (logError) {
          console.error('Error updating attempt status:', logError)
        }
      }

      return NextResponse.json(
        { error: 'Failed to reset password. Please try again.' },
        { status: 500 }
      )
    }

    // Mark password reset attempt as completed
    if (attemptId) {
      try {
        await supabaseAdmin.rpc('mark_password_reset_completed', {
          p_attempt_id: attemptId,
        })
      } catch (logError) {
        // Log error but don't fail the request
        console.error('Error marking attempt as completed:', logError)
      }
    } else {
      // If no attemptId provided, try to find and update the most recent attempt
      try {
        const { data: recentAttempt } = await supabaseAdmin
          .from('password_reset_attempts')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'requested')
          .order('requested_at', { ascending: false })
          .limit(1)
          .single()

        if (recentAttempt?.id) {
          await supabaseAdmin.rpc('mark_password_reset_completed', {
            p_attempt_id: recentAttempt.id,
          })
        }
      } catch (logError) {
        // Silently fail - logging is optional
        console.error('Error finding and updating attempt:', logError)
      }
    }

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in reset-password route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
