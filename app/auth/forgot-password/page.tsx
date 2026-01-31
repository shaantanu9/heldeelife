'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Mail,
  ArrowLeft,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrPhone }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'An error occurred. Please try again.')
        setLoading(false)
      } else {
        setSuccess(true)
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
      setLoading(false)
    }
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
              Forgot Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your email or phone number to receive a password reset link
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
                    Password reset link has been sent! Please check your email
                    or phone for instructions.
                  </AlertDescription>
                </Alert>
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/auth/signin')}
                    className="w-full h-12 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Sign In
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="emailOrPhone"
                    className="text-sm font-semibold text-gray-900"
                  >
                    Email or Phone Number
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-orange-600" />
                    <Input
                      id="emailOrPhone"
                      type="text"
                      placeholder="you@example.com or +1234567890"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      className="pl-12 h-12 rounded-lg border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="pt-4 border-t border-gray-100">
              <div className="text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link
                  href="/auth/signin"
                  className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}









