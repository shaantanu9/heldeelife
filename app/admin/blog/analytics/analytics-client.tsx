'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Eye,
  TrendingUp,
  BarChart3,
  AlertCircle,
  Loader2,
  Calendar,
  Tag,
  Folder,
} from 'lucide-react'
import Link from 'next/link'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface BlogAnalytics {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  archivedPosts: number
  totalViews: number
  averageViews: number
  averageSeoScore: number
  averageReadingTime: number
  topPosts: Array<{ id: string; title: string; views: number; seo_score: number; slug: string }>
  lowSeoPosts: Array<{ id: string; title: string; seo_score: number; slug: string }>
  categoryStats: Array<{ id: string; name: string; slug: string; count: number; views: number }>
  tagStats: Array<{ id: string; name: string; slug: string; count: number }>
  viewsOverTime: Array<{ date: string; views: number }>
}

export function BlogAnalyticsClient() {
  const [analytics, setAnalytics] = useState<BlogAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/blog/analytics?period=${period}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
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

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No analytics data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Blog Analytics</h1>
          <p className="text-muted-foreground">
            Track your blog performance and content insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/admin/blog">
            <Button variant="outline">Back to Blog</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.publishedPosts} published, {analytics.draftPosts} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {analytics.averageViews} per post
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg SEO Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageSeoScore}/100</div>
            <p className="text-xs text-muted-foreground">
              {analytics.lowSeoPosts.length} posts need improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Reading Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageReadingTime} min</div>
            <p className="text-xs text-muted-foreground">Average per post</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Views Over Time</CardTitle>
            <CardDescription>Post views in the last {period} days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.viewsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#E55A2B"
                  strokeWidth={2}
                  name="Views"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Most popular categories by views</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={analytics.categoryStats.slice(0, 5)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="views" fill="#E55A2B" name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Performing Posts
            </CardTitle>
            <CardDescription>Most viewed posts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPosts.slice(0, 5).map((post, index) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="font-medium hover:text-orange-600"
                      >
                        {post.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        SEO: {post.seo_score}/100
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{post.views.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">views</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Posts Needing SEO Improvement
            </CardTitle>
            <CardDescription>Posts with SEO score below 70</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.lowSeoPosts.length > 0 ? (
                analytics.lowSeoPosts.slice(0, 5).map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="font-medium hover:text-orange-600"
                      >
                        {post.title}
                      </Link>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">{post.seo_score}/100</p>
                      <p className="text-xs text-muted-foreground">SEO score</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  All posts have good SEO scores! 🎉
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category and Tag Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Category Statistics
            </CardTitle>
            <CardDescription>Posts per category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.categoryStats.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {category.views.toLocaleString()} views
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{category.count}</p>
                    <p className="text-xs text-muted-foreground">posts</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tag Statistics
            </CardTitle>
            <CardDescription>Most used tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.tagStats.slice(0, 10).map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <p className="font-medium">{tag.name}</p>
                  <div className="text-right">
                    <p className="font-semibold">{tag.count}</p>
                    <p className="text-xs text-muted-foreground">posts</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}






