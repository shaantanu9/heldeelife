'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  TrendingUp,
  DollarSign,
  Loader2,
  RotateCcw,
  ShoppingBag,
  Star,
  Search,
} from 'lucide-react'
import { QuickActions } from '@/components/admin/quick-actions'

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
  pendingOrders: number
  lowStockProducts: number
  recentOrders: any[]
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Fetch products count
      const productsRes = await fetch('/api/products')
      const productsData = await productsRes.json()
      const totalProducts = productsData.products?.length || 0

      // Fetch orders
      const ordersRes = await fetch('/api/orders')
      const ordersData = await ordersRes.json()
      const orders = ordersData.orders || []
      const totalOrders = orders.length
      const pendingOrders = orders.filter(
        (o: any) => o.status === 'pending'
      ).length
      const totalRevenue = orders
        .filter((o: any) => o.status === 'delivered' || o.status === 'shipped')
        .reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0)

      // Fetch users count
      const usersRes = await fetch('/api/admin/users')
      const usersData = await usersRes.json()
      const totalUsers = usersData.users?.length || 0

      // Get low stock products
      const inventoryRes = await fetch('/api/products/inventory?low_stock=true')
      const inventoryData = await inventoryRes.json()
      const lowStockProducts = inventoryData.inventory?.length || 0

      // Recent orders
      const recentOrders = orders.slice(0, 5)

      setStats({
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue,
        pendingOrders,
        lowStockProducts,
        recentOrders,
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">
            Admin <span className="text-orange-600">Dashboard</span>
          </h1>
          <p className="text-gray-600">
            Manage your ecommerce platform and content
          </p>
        </div>

        {/* Quick Actions & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1">
            <QuickActions
              pendingOrders={stats?.pendingOrders}
              lowStockProducts={stats?.lowStockProducts}
            />
          </div>
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                Rs. {stats?.totalRevenue.toLocaleString('en-IN') || '0'}
              </div>
              <p className="text-xs text-gray-500">From delivered orders</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Orders
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalOrders || 0}
              </div>
              <p className="text-xs text-gray-500">
                {stats?.pendingOrders || 0} pending
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalProducts || 0}
              </div>
              <p className="text-xs text-gray-500">Active products</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-gray-500">Registered users</p>
            </CardContent>
          </Card>
            </div>
          </div>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <FileText className="h-5 w-5 text-orange-600" />
                Blog Management
              </CardTitle>
              <CardDescription className="text-gray-600">
                Create and manage blog posts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/blog">
                <Button className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                  Manage Blog
                </Button>
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/admin/blog/categories">
                  <Button
                    variant="outline"
                    className="w-full text-xs"
                    size="sm"
                  >
                    Categories
                  </Button>
                </Link>
                <Link href="/admin/blog/tags">
                  <Button
                    variant="outline"
                    className="w-full text-xs"
                    size="sm"
                  >
                    Tags
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Package className="h-5 w-5 text-orange-600" />
                Products
              </CardTitle>
              <CardDescription className="text-gray-600">
                Manage products and inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/products">
                <Button className="w-full rounded-lg" variant="outline">
                  Manage Products
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <ShoppingCart className="h-5 w-5 text-orange-600" />
                Orders
              </CardTitle>
              <CardDescription className="text-gray-600">
                View and manage orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/orders">
                <Button className="w-full rounded-lg" variant="outline">
                  Manage Orders
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Users className="h-5 w-5 text-orange-600" />
                Users
              </CardTitle>
              <CardDescription className="text-gray-600">
                View and manage users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/users">
                <Button className="w-full rounded-lg" variant="outline">
                  Manage Users
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                Analytics
              </CardTitle>
              <CardDescription className="text-gray-600">
                View sales and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/analytics">
                <Button className="w-full rounded-lg" variant="outline">
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Search className="h-5 w-5 text-orange-600" />
                SEO Audit
              </CardTitle>
              <CardDescription className="text-gray-600">
                Site-wide SEO health check
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/seo">
                <Button className="w-full rounded-lg" variant="outline">
                  Run SEO Audit
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Settings className="h-5 w-5 text-orange-600" />
                Settings
              </CardTitle>
              <CardDescription className="text-gray-600">
                Configure platform settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/settings">
                <Button className="w-full rounded-lg" variant="outline">
                  Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                Coupons
              </CardTitle>
              <CardDescription className="text-gray-600">
                Manage discount coupons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/coupons">
                <Button className="w-full rounded-lg" variant="outline">
                  Manage Coupons
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <FileText className="h-5 w-5 text-orange-600" />
                Reviews
              </CardTitle>
              <CardDescription className="text-gray-600">
                Moderate product reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/reviews">
                <Button className="w-full rounded-lg" variant="outline">
                  Moderate Reviews
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <RotateCcw className="h-5 w-5 text-orange-600" />
                Returns & Refunds
              </CardTitle>
              <CardDescription className="text-gray-600">
                Manage return requests and refunds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/returns">
                <Button className="w-full rounded-lg" variant="outline">
                  Manage Returns
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <ShoppingBag className="h-5 w-5 text-orange-600" />
                Abandoned Carts
              </CardTitle>
              <CardDescription className="text-gray-600">
                Recover abandoned shopping carts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/abandoned-carts">
                <Button className="w-full rounded-lg" variant="outline">
                  View Abandoned Carts
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Star className="h-5 w-5 text-orange-600" />
                Loyalty Program
              </CardTitle>
              <CardDescription className="text-gray-600">
                Manage customer loyalty points and rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/loyalty">
                <Button className="w-full rounded-lg" variant="outline">
                  Manage Loyalty
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        {stats?.recentOrders && stats.recentOrders.length > 0 && (
          <Card className="border border-gray-200 shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Recent Orders</CardTitle>
              <CardDescription>
                Latest orders that need attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {order.order_number}
                      </p>
                      <p className="text-sm text-gray-600">
                        Rs. {Number(order.total_amount).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {order.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/admin/orders">
                  <Button variant="outline" className="w-full rounded-lg">
                    View All Orders
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
