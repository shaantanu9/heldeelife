'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Plus,
  FileText,
  Package,
  ShoppingCart,
  AlertTriangle,
  Eye,
} from 'lucide-react'
import Link from 'next/link'

interface QuickActionsProps {
  pendingOrders?: number
  lowStockProducts?: number
  pendingReviews?: number
}

export function QuickActions({
  pendingOrders = 0,
  lowStockProducts = 0,
  pendingReviews = 0,
}: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Frequently used actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Link href="/admin/blog/new">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Package className="h-4 w-4 mr-2" />
              New Product
            </Button>
          </Link>
        </div>

        <div className="pt-3 border-t space-y-2">
          <Link href="/admin/orders?status=pending">
            <Button
              variant="ghost"
              className="w-full justify-between"
              size="sm"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span>Pending Orders</span>
              </div>
              {pendingOrders > 0 && (
                <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingOrders}
                </span>
              )}
            </Button>
          </Link>

          <Link href="/admin/products/inventory?low_stock=true">
            <Button
              variant="ghost"
              className="w-full justify-between"
              size="sm"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span>Low Stock</span>
              </div>
              {lowStockProducts > 0 && (
                <span className="bg-yellow-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {lowStockProducts}
                </span>
              )}
            </Button>
          </Link>

          <Link href="/admin/reviews?status=pending">
            <Button
              variant="ghost"
              className="w-full justify-between"
              size="sm"
            >
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>Pending Reviews</span>
              </div>
              {pendingReviews > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingReviews}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}






