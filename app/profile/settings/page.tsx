'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Save,
  Loader2,
  CheckCircle2,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    setFormData({
      name: session.user?.name || '',
      email: session.user?.email || '',
      phone: session.user?.phoneNumber || '',
    })
  }, [session, router])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (loading) return

      try {
        setLoading(true)
        const response = await fetch('/api/auth/update-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          await update()
          toast.success('Profile updated successfully', {
            description: 'Your changes have been saved',
          })
        } else {
          const error = await response.json()
          toast.error('Failed to update profile', {
            description: error.error || 'Please try again',
          })
        }
      } catch (error) {
        console.error('Error updating profile:', error)
        toast.error('Failed to update profile', {
          description: 'Please try again later',
        })
      } finally {
        setLoading(false)
      }
    },
    [formData, loading, update]
  )

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Account Settings
            </h1>
            <p className="text-gray-600">
              Manage your account information and preferences
            </p>
          </div>

          {/* Profile Information */}
          <Card className="border border-gray-200 shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter your full name"
                    required
                    className="rounded-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter your email"
                    required
                    disabled
                    className="rounded-lg bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter your phone number"
                    className="rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Used for order updates and notifications
                  </p>
                </div>

                <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-blue-900">
                    Your information is secure and encrypted. We never share your
                    data with third parties.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card className="border border-gray-200 shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">Password</p>
                    <p className="text-sm text-gray-600">
                      Last changed: Never
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => router.push('/auth/forgot-password')}
                  >
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">
                      Account Verified
                    </p>
                    <p className="text-xs text-green-700">
                      Your account is secure and verified
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="border border-gray-200 shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  More preference options coming soon. You can manage your
                  notification settings and account preferences here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}









