'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, User, Mail, Phone, Calendar } from 'lucide-react'
import { formatDateDisplay } from '@/lib/utils/date'

interface UserDetail {
  id: string
  email: string
  phone_number: string | null
  full_name: string | null
  role: string
  created_at: string
  loyalty_points?: number
  loyalty_tier?: string | null
  total_orders?: number
  total_spent?: number
}

export function AdminUserDetailClient({ userId }: { userId: string }) {
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/admin/users/${userId}`)
        if (!res.ok) {
          if (res.status === 404) setError('User not found')
          else setError('Failed to load user')
          return
        }
        const data = await res.json()
        setUser(data.user)
      } catch {
        setError('Failed to load user')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="container py-8">
        <p className="text-red-600 mb-4">{error ?? 'User not found'}</p>
        <Button variant="outline" onClick={() => router.push('/admin/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>
    )
  }

  const getTierColor = (tier?: string | null) => {
    if (!tier) return 'bg-gray-100 text-gray-800'
    switch (tier) {
      case 'diamond':
        return 'bg-purple-100 text-purple-800'
      case 'platinum':
        return 'bg-gray-100 text-gray-800'
      case 'gold':
        return 'bg-yellow-100 text-yellow-800'
      case 'silver':
        return 'bg-gray-200 text-gray-800'
      case 'bronze':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          User <span className="text-orange-600">Details</span>
        </h1>
        <p className="text-gray-600 mt-1">
          View details for {user.full_name || user.email || user.id}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">
                {user.full_name || '—'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user.email || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{user.phone_number || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="font-medium">
                  {formatDateDisplay(user.created_at)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Role</p>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Loyalty points</p>
              <p className="text-2xl font-bold text-orange-600">
                {user.loyalty_points ?? 0}
              </p>
              {user.loyalty_tier && (
                <Badge className={getTierColor(user.loyalty_tier)}>
                  {user.loyalty_tier}
                </Badge>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Total orders</p>
              <p className="text-2xl font-bold">{user.total_orders ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total spent</p>
              <p className="text-2xl font-bold">
                ₹{Number(user.total_spent ?? 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
