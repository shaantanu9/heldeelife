'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  User,
  LogOut,
  LogIn,
  FileText,
  Package,
  MapPin,
  CreditCard,
  RefreshCw,
  Heart,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Shield,
  Settings,
  ShoppingBag,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface AccountStats {
  totalOrders: number
  totalSpent: number
  wishlistCount: number
  addressesCount: number
  paymentMethodsCount: number
  pendingOrders: number
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<AccountStats>({
    totalOrders: 0,
    totalSpent: 0,
    wishlistCount: 0,
    addressesCount: 0,
    paymentMethodsCount: 0,
    pendingOrders: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    if (!session) return

    try {
      setLoading(true)
      const [ordersRes, wishlistRes, addressesRes, paymentsRes] =
        await Promise.all([
          fetch('/api/orders'),
          fetch('/api/wishlist'),
          fetch('/api/addresses'),
          fetch('/api/payments/methods'),
        ])

      const orders = ordersRes.ok ? await ordersRes.json() : { orders: [] }
      const wishlist = wishlistRes.ok
        ? await wishlistRes.json()
        : { wishlist: [] }
      const addresses = addressesRes.ok
        ? await addressesRes.json()
        : { addresses: [] }
      const payments = paymentsRes.ok
        ? await paymentsRes.json()
        : { methods: [] }

      const totalSpent = orders.orders?.reduce(
        (sum: number, order: any) =>
          sum + (order.payment_status === 'paid' ? Number(order.total_amount) : 0),
        0
      ) || 0

      const pendingOrders =
        orders.orders?.filter(
          (order: any) =>
            order.status === 'pending' || order.status === 'processing'
        ).length || 0

      setStats({
        totalOrders: orders.orders?.length || 0,
        totalSpent,
        wishlistCount: wishlist.wishlist?.length || 0,
        addressesCount: addresses.addresses?.length || 0,
        paymentMethodsCount: payments.methods?.length || 0,
        pendingOrders,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (session) {
      fetchStats()
    }
  }, [session, fetchStats])

  // Calculate account completion percentage (Zeigarnik Effect)
  const accountCompletion = Math.min(
    100,
    Math.round(
      ((stats.addressesCount > 0 ? 25 : 0) +
        (stats.paymentMethodsCount > 0 ? 25 : 0) +
        (session?.user?.name ? 25 : 0) +
        (session?.user?.phoneNumber ? 25 : 0)) /
        1
    )
  )

  // Incomplete tasks (Zeigarnik Effect)
  const incompleteTasks = [
    stats.addressesCount === 0 && {
      title: 'Add a delivery address',
      description: 'Make checkout faster',
      href: '/profile/addresses',
      icon: MapPin,
      color: 'blue',
    },
    stats.paymentMethodsCount === 0 && {
      title: 'Add a payment method',
      description: 'Speed up your checkout',
      href: '/profile/payments',
      icon: CreditCard,
      color: 'green',
    },
    !session?.user?.phoneNumber && {
      title: 'Add phone number',
      description: 'For order updates',
      href: '/profile/settings',
      icon: User,
      color: 'orange',
    },
  ].filter(Boolean)

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-24">
        <div className="container px-4">
          <div className="max-w-md mx-auto">
            <Card className="border border-gray-200 shadow-xl bg-white">
              <CardContent className="p-8 text-center">
                <User className="h-16 w-16 mx-auto text-gray-300 mb-6" />
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Sign In
                </h1>
                <p className="text-gray-600 mb-8">
                  Sign in to access your account and track your orders
                </p>
                <Button
                  size="lg"
                  className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  onClick={() => signIn(undefined, { callbackUrl: '/profile' })}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header with Account Stats (Social Proof) */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                My Account
              </h1>
              <p className="text-gray-600">
                Welcome back, {session.user?.name || 'User'}!
              </p>
            </div>
            {session.user.role === 'admin' && (
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="rounded-lg border-orange-200 hover:bg-orange-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </Button>
              </Link>
            )}
          </div>

          {/* Account Statistics (Social Proof) */}
          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border border-gray-200 shadow-md bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalOrders}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-md bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                      <p className="text-2xl font-bold text-gray-900">
                        Rs. {Math.round(stats.totalSpent).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-md bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Wishlist</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.wishlistCount}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-pink-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-md bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.pendingOrders}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Profile Card with Account Completion (Progress Indicator) */}
          <Card className="border border-gray-200 shadow-xl bg-white">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                    {session.user?.name || 'User'}
                  </h2>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-1">{session.user?.email}</p>
                  {session.user?.phoneNumber && (
                    <p className="text-gray-500 text-sm">
                      Phone: {session.user.phoneNumber}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>

              {/* Account Completion Progress (Zeigarnik Effect) */}
              {accountCompletion < 100 && (
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        Complete Your Profile
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {accountCompletion}%
                    </span>
                  </div>
                  <Progress value={accountCompletion} className="h-2 mb-3" />
                  <p className="text-xs text-gray-500">
                    Complete your profile to unlock faster checkout and exclusive
                    offers
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incomplete Tasks Reminder (Zeigarnik Effect) */}
          {incompleteTasks.length > 0 && (
            <Card className="border border-orange-200 shadow-md bg-orange-50/50">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {incompleteTasks.map((task: any, index) => {
                    const Icon = task.icon
                    const colorClasses: Record<string, { bg: string; text: string }> = {
                      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
                      green: { bg: 'bg-green-100', text: 'text-green-600' },
                      orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
                    }
                    const colors = colorClasses[task.color] || colorClasses.blue
                    return (
                      <Link
                        key={index}
                        href={task.href}
                        className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}
                          >
                            <Icon className={`h-5 w-5 ${colors.text}`} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {task.title}
                            </p>
                            <p className="text-xs text-gray-600">
                              {task.description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Access Cards (Gestalt Principles - Grouped Related Items) */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Account Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/profile/orders">
                <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white h-full group cursor-pointer">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <Package className="h-6 w-6 text-orange-600" />
                    </div>
                      <div className="flex-1">
                      <h3 className="font-bold text-gray-900">Order History</h3>
                      <p className="text-sm text-gray-600">
                        View & track orders
                      </p>
                    </div>
                      {stats.totalOrders > 0 && (
                        <Badge className="bg-orange-100 text-orange-800">
                          {stats.totalOrders}
                        </Badge>
                      )}
                    </div>
                    {stats.pendingOrders > 0 && (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{stats.pendingOrders} pending</span>
                  </div>
                    )}
                </CardContent>
              </Card>
            </Link>

            <Link href="/profile/addresses">
                <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white h-full group cursor-pointer">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                      <div className="flex-1">
                      <h3 className="font-bold text-gray-900">
                        Saved Addresses
                      </h3>
                        <p className="text-sm text-gray-600">
                          Manage addresses
                        </p>
                      </div>
                      {stats.addressesCount > 0 && (
                        <Badge className="bg-blue-100 text-blue-800">
                          {stats.addressesCount}
                        </Badge>
                      )}
                    </div>
                    {stats.addressesCount === 0 && (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Add your first address</span>
                  </div>
                    )}
                </CardContent>
              </Card>
            </Link>

            <Link href="/profile/payments">
                <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white h-full group cursor-pointer">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                      <div className="flex-1">
                      <h3 className="font-bold text-gray-900">
                        Payment Methods
                      </h3>
                      <p className="text-sm text-gray-600">
                        Manage payment options
                      </p>
                    </div>
                      {stats.paymentMethodsCount > 0 && (
                        <Badge className="bg-green-100 text-green-800">
                          {stats.paymentMethodsCount}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Shield className="h-4 w-4" />
                      <span>Secure & encrypted</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/profile/wishlist">
                <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white h-full group cursor-pointer">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                      <Heart className="h-6 w-6 text-pink-600" />
                    </div>
                      <div className="flex-1">
                      <h3 className="font-bold text-gray-900">Wishlist</h3>
                      <p className="text-sm text-gray-600">Saved products</p>
                      </div>
                      {stats.wishlistCount > 0 && (
                        <Badge className="bg-pink-100 text-pink-800">
                          {stats.wishlistCount}
                        </Badge>
                      )}
                    </div>
                    {stats.wishlistCount === 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Heart className="h-4 w-4" />
                        <span>Start saving favorites</span>
                  </div>
                    )}
                </CardContent>
              </Card>
            </Link>

            <Link href="/profile/returns">
                <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white h-full group cursor-pointer">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <RefreshCw className="h-6 w-6 text-purple-600" />
                    </div>
                      <div className="flex-1">
                      <h3 className="font-bold text-gray-900">
                        Returns & Refunds
                      </h3>
                      <p className="text-sm text-gray-600">Track returns</p>
                    </div>
                  </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>30-day return policy</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/profile/settings">
                <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white h-full group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <Settings className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">Settings</h3>
                        <p className="text-sm text-gray-600">
                          Account preferences
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="h-4 w-4" />
                      <span>Manage your account</span>
                    </div>
                </CardContent>
              </Card>
            </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
