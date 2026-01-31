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
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Search,
} from 'lucide-react'
import Link from 'next/link'

interface SEOIssue {
  type: 'error' | 'warning' | 'info'
  field: string
  message: string
  count: number
  items?: Array<{ id: string; title: string; url: string }>
}

interface SEOAuditResult {
  overallScore: number
  totalIssues: number
  errors: number
  warnings: number
  issues: SEOIssue[]
}

export function SEOAuditClient() {
  const [auditResult, setAuditResult] = useState<SEOAuditResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runAudit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/seo/audit')
      if (!response.ok) {
        throw new Error('Failed to run SEO audit')
      }
      const data = await response.json()
      setAuditResult(data)
    } catch (error) {
      console.error('Error running SEO audit:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runAudit()
  }, [])

  if (loading && !auditResult) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (!auditResult) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No audit data available
            </p>
            <Button onClick={runAudit}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Audit
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">SEO Audit</h1>
          <p className="text-muted-foreground">
            Site-wide SEO health check and recommendations
          </p>
        </div>
        <Button onClick={runAudit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Audit
            </>
          )}
        </Button>
      </div>

      {/* Overall Score */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Overall SEO Health Score</CardTitle>
              <CardDescription>
                Based on {auditResult.totalIssues} issues found
              </CardDescription>
            </div>
            <Badge
              variant={getScoreBadge(auditResult.overallScore)}
              className="text-3xl px-6 py-3"
            >
              {auditResult.overallScore}/100
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">
                {auditResult.errors}
              </div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">
                {auditResult.warnings}
              </div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {auditResult.totalIssues - auditResult.errors - auditResult.warnings}
              </div>
              <div className="text-sm text-muted-foreground">Info</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="space-y-6">
        {auditResult.issues.map((issue, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {issue.type === 'error' && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  {issue.type === 'warning' && (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  {issue.type === 'info' && (
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  )}
                  <CardTitle>{issue.field}</CardTitle>
                </div>
                <Badge
                  variant={
                    issue.type === 'error'
                      ? 'destructive'
                      : issue.type === 'warning'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {issue.count} {issue.count === 1 ? 'item' : 'items'}
                </Badge>
              </div>
              <CardDescription>{issue.message}</CardDescription>
            </CardHeader>
            {issue.items && issue.items.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  {issue.items.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.url}</p>
                      </div>
                      <Link href={item.url}>
                        <Button variant="ghost" size="sm">
                          <Search className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {issue.items.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ... and {issue.items.length - 10} more
                    </p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}






