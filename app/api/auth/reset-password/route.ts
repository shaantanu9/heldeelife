import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
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

    // Create a Supabase client with the access token
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('Missing SUPABASE_URL')
    }

    // Use the access token to create a session and update password
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // Not needed for password update
      })

    if (sessionError || !sessionData.session?.user) {
      console.error('Session error:', sessionError)

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

    const userId = sessionData.session.user.id

    // Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.updateUser({
      password: password,
    })

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
