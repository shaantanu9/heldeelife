'use client'

import { useState, useEffect } from 'react'
import { Loader2, ArrowLeft, Trophy } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface VariantRow {
  variant: string
  impressions: number
  ctaClicks: number
  ctr: number
}

export function AbTestingClient() {
  const [rows, setRows] = useState<VariantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/ab-events/results')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
          return
        }
        const results: Record<string, Record<string, number>> = data.results || {}
        const parsed: VariantRow[] = Object.entries(results).map(([variant, events]) => {
          const impressions = events['variant_shown'] ?? 0
          const ctaClicks = events['cta_clicked'] ?? 0
          const ctr = impressions > 0 ? (ctaClicks / impressions) * 100 : 0
          return { variant, impressions, ctaClicks, ctr }
        })
        // Sort by CTR descending
        parsed.sort((a, b) => b.ctr - a.ctr)
        setRows(parsed)
      })
      .catch(() => setError('Failed to load A/B testing data'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  const winner = rows[0]

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          A/B Testing <span className="text-orange-600">Results</span>
        </h1>
        <p className="text-gray-600 mt-2">Hero headline variant performance</p>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-600">{error}</CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-600">
            No A/B experiment data yet. Events will appear once users visit the homepage.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Variant Performance</CardTitle>
            <CardDescription>
              Impressions, CTA clicks, and click-through rate per variant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 pr-6 font-semibold text-gray-700">Variant</th>
                    <th className="pb-3 pr-6 font-semibold text-gray-700 text-right">Impressions</th>
                    <th className="pb-3 pr-6 font-semibold text-gray-700 text-right">CTA Clicks</th>
                    <th className="pb-3 font-semibold text-gray-700 text-right">CTR %</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isWinner = winner && row.variant === winner.variant && row.ctr > 0
                    return (
                      <tr
                        key={row.variant}
                        className={`border-b border-gray-100 last:border-0 ${
                          isWinner ? 'bg-orange-50' : ''
                        }`}
                      >
                        <td className="py-4 pr-6">
                          <div className="flex items-center gap-2">
                            {isWinner && (
                              <Trophy className="h-4 w-4 text-orange-600 flex-shrink-0" />
                            )}
                            <span
                              className={`font-medium capitalize ${
                                isWinner ? 'text-orange-700' : 'text-gray-900'
                              }`}
                            >
                              {row.variant}
                            </span>
                            {isWinner && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                Winner
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 pr-6 text-right text-gray-700">
                          {row.impressions.toLocaleString()}
                        </td>
                        <td className="py-4 pr-6 text-right text-gray-700">
                          {row.ctaClicks.toLocaleString()}
                        </td>
                        <td className="py-4 text-right">
                          <span
                            className={`font-semibold ${
                              isWinner ? 'text-orange-600' : 'text-gray-700'
                            }`}
                          >
                            {row.ctr.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
