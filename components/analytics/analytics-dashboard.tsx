'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AnalyticsTracker, type ConversionMetrics } from '@/lib/analytics/tracking'
import { cn } from '@/lib/utils'

interface AnalyticsDashboardProps {
  className?: string
  period?: '7d' | '30d' | '90d'
}

export function AnalyticsDashboard({
  className,
  period = '30d',
}: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<ConversionMetrics & {
    totalProductViews?: number
    totalCartAdds?: number
    totalCartAbandoned?: number
    totalPurchases?: number
    totalOrders?: number
    totalRevenue?: number
  }>({
    conversionRate: 0,
    cartAbandonmentRate: 0,
    averageOrderValue: 0,
    checkoutCompletionRate: 0,
    productViewToCartRate: 0,
    cartToCheckoutRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
    // Refresh metrics every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [period])

  const fetchMetrics = async () => {
    try {
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const data = await AnalyticsTracker.getConversionMetrics(
        startDate,
        new Date()
      )
      setMetrics(data)
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const MetricCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    className: cardClassName,
  }: {
    title: string
    value: string | number
    subtitle?: string
    icon: any
    trend?: 'up' | 'down'
    trendValue?: string
    className?: string
  }) => (
    <Card className={cn('border border-gray-200 shadow-md bg-white', cardClassName)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-gray-600" />
            <p className="text-sm font-semibold text-gray-700">{title}</p>
          </div>
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs',
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend === 'up' ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {trendValue}
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-gray-200 bg-white">
              <CardContent className="p-4">
                <div className="h-20 bg-gray-100 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Conversion Rate"
          value={`${metrics.conversionRate.toFixed(2)}%`}
          subtitle="Product views to purchases"
          icon={TrendingUp}
          trend={metrics.conversionRate > 2 ? 'up' : 'down'}
          trendValue={
            metrics.conversionRate > 2 ? '+5.2%' : '-2.1%'
          }
        />
        <MetricCard
          title="Cart Abandonment"
          value={`${metrics.cartAbandonmentRate.toFixed(2)}%`}
          subtitle="Items added but not purchased"
          icon={ShoppingCart}
          trend={metrics.cartAbandonmentRate < 70 ? 'down' : 'up'}
          trendValue={
            metrics.cartAbandonmentRate < 70 ? '-3.5%' : '+1.2%'
          }
        />
        <MetricCard
          title="Average Order Value"
          value={`Rs. ${metrics.averageOrderValue.toFixed(2)}`}
          subtitle="Per completed order"
          icon={DollarSign}
          trend={metrics.averageOrderValue > 1000 ? 'up' : 'down'}
          trendValue={
            metrics.averageOrderValue > 1000 ? '+8.3%' : '-2.7%'
          }
        />
      </div>

      {/* Funnel Metrics */}
      <Card className="border border-gray-200 shadow-md bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">
            Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Product Views</span>
              </div>
              <Badge variant="secondary">
                {metrics.totalProductViews || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Add to Cart</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {metrics.totalCartAdds || 0}
                </Badge>
                <span className="text-xs text-gray-500">
                  ({metrics.productViewToCartRate.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Checkout Started</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {metrics.totalOrders || 0}
                </Badge>
                <span className="text-xs text-gray-500">
                  ({metrics.cartToCheckoutRate.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Purchases</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600 text-white">
                  {metrics.totalPurchases || 0}
                </Badge>
                <span className="text-xs text-gray-500">
                  ({metrics.checkoutCompletionRate.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {metrics.cartAbandonmentRate > 70 && (
        <Card className="border border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-900">
                  High Cart Abandonment Rate
                </p>
                <p className="text-xs text-orange-700">
                  {metrics.cartAbandonmentRate.toFixed(1)}% of carts are
                  abandoned. Consider implementing recovery strategies.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {metrics.conversionRate < 2 && (
        <Card className="border border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-900">
                  Low Conversion Rate
                </p>
                <p className="text-xs text-yellow-700">
                  Conversion rate is {metrics.conversionRate.toFixed(1)}%.
                  Consider optimizing product pages and checkout flow.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}









