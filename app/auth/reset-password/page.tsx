'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    // Check if we have tokens in the URL hash (Supabase redirects with tokens)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')

    if (type === 'recovery' && accessToken) {
      // We have a valid recovery token
      setInitializing(false)
    } else {
      // Check if token is in query params (fallback)
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')

      if (!token && !accessToken) {
        setError(
          'Invalid or missing reset token. Please request a new password reset link.'
        )
        setInitializing(false)
      } else {
        setInitializing(false)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Extract tokens from URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (!accessToken) {
        // Fallback to query params
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('token')

        if (!token) {
          setError('Invalid or missing reset token')
          setLoading(false)
          return
        }

        // Use API route with token
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: token,
            password,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'An error occurred. Please try again.')
          setLoading(false)
        } else {
          setSuccess(true)
          setLoading(false)
          setTimeout(() => {
            router.push('/auth/signin')
          }, 2000)
        }
      } else {
        // Use Supabase client directly with tokens from hash
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (sessionError) {
          setError(
            'Invalid or expired reset token. Please request a new password reset link.'
          )
          setLoading(false)
          return
        }

        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        })

        if (updateError) {
          setError(
            updateError.message || 'Failed to reset password. Please try again.'
          )
          setLoading(false)
        } else {
          setSuccess(true)
          setLoading(false)
          setTimeout(() => {
            router.push('/auth/signin')
          }, 2000)
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-600" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-light tracking-wider text-gray-900 hover:text-orange-600 transition-colors">
              heldeelife
            </span>
          </Link>
        </div>

        <Card className="border border-gray-200 shadow-xl bg-white">
          <CardHeader className="space-y-1 pb-6 border-b border-gray-100">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Reset Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {error && (
              <Alert
                variant="destructive"
                className="animate-fade-in border-red-200 bg-red-50"
              >
                <AlertDescription className="text-red-800 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success ? (
              <div className="space-y-4">
                <Alert className="animate-fade-in border-green-300 bg-green-50 shadow-md">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                  <AlertDescription className="text-green-800 font-medium">
                    Password reset successfully! Redirecting to sign in...
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-900"
                  >
                    New Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-orange-600" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password (min. 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 h-12 rounded-lg border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-orange-600 hover:bg-orange-50 focus:outline-none transition-all duration-200"
                      disabled={loading}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-semibold text-gray-900"
                  >
                    Confirm New Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-orange-600" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-12 pr-12 h-12 rounded-lg border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-orange-600 hover:bg-orange-50 focus:outline-none transition-all duration-200"
                      disabled={loading}
                      aria-label={
                        showConfirmPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  disabled={loading || !!error}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="pt-4 border-t border-gray-100">
              <div className="text-center text-sm text-gray-600">
                <Link
                  href="/auth/signin"
                  className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
