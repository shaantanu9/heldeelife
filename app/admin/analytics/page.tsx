import { requireAdmin } from '@/lib/utils/auth'
import { AdminAnalyticsClient } from './client'
import { supabaseAdmin } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy } from 'lucide-react'

interface AbRow {
  variant_id: string
  event_type: string
  count: number
}

interface VariantStats {
  variant: string
  impressions: number
  clicks: number
  ctr: number
  lift: string
}

async function getAbStats(): Promise<VariantStats[]> {
  const { data, error } = await supabaseAdmin.rpc('get_ab_event_counts')
  if (error || !data) return []

  const rows: AbRow[] = (data as AbRow[]).map((r) => ({ ...r, count: Number(r.count) }))

  // Group flat rows by variant_id
  const grouped: Record<string, Record<string, number>> = {}
  for (const row of rows) {
    if (!grouped[row.variant_id]) grouped[row.variant_id] = {}
    grouped[row.variant_id][row.event_type] = row.count
  }

  const variants = Object.entries(grouped).map(([variant, events]) => {
    const impressions = events['variant_shown'] ?? 0
    const clicks = events['cta_clicked'] ?? 0
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
    return { variant, impressions, clicks, ctr }
  })

  const controlCtr = variants.find((v) => v.variant === 'control')?.ctr ?? 0

  return variants
    .sort((a, b) => b.ctr - a.ctr)
    .map((v) => {
      let lift: string
      if (v.variant === 'control') {
        lift = '—'
      } else if (controlCtr === 0) {
        lift = 'N/A'
      } else {
        const pct = ((v.ctr - controlCtr) / controlCtr) * 100
        lift = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%'
      }
      return { ...v, lift }
    })
}

export default async function AdminAnalyticsPage() {
  await requireAdmin()
  const abStats = await getAbStats()

  const winner = abStats.length > 0 && abStats[0].ctr > 0 ? abStats[0] : null

  return (
    <>
      <AdminAnalyticsClient />

      {/* A/B Testing Dashboard */}
      <div className="container pb-10">
        <Card>
          <CardHeader>
            <CardTitle>A/B Testing Results</CardTitle>
            <CardDescription>
              Hero headline variant performance — impressions, clicks, CTR, and lift vs control
            </CardDescription>
          </CardHeader>
          <CardContent>
            {abStats.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                No A/B experiment data yet. Events will appear once users visit the homepage.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="pb-3 pr-6 font-semibold text-gray-700">Variant</th>
                      <th className="pb-3 pr-6 font-semibold text-gray-700 text-right">
                        Impressions
                      </th>
                      <th className="pb-3 pr-6 font-semibold text-gray-700 text-right">Clicks</th>
                      <th className="pb-3 pr-6 font-semibold text-gray-700 text-right">CTR %</th>
                      <th className="pb-3 font-semibold text-gray-700 text-right">
                        Lift vs Control
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {abStats.map((row) => {
                      const isWinner = winner?.variant === row.variant
                      return (
                        <tr
                          key={row.variant}
                          className={`border-b border-gray-100 last:border-0 ${isWinner ? 'bg-orange-50' : ''}`}
                        >
                          <td className="py-4 pr-6">
                            <div className="flex items-center gap-2">
                              {isWinner && (
                                <Trophy className="h-4 w-4 flex-shrink-0 text-orange-600" />
                              )}
                              <span
                                className={`font-medium capitalize ${isWinner ? 'text-orange-700' : 'text-gray-900'}`}
                              >
                                {row.variant}
                              </span>
                              {isWinner && (
                                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                                  Winner
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 pr-6 text-right text-gray-700">
                            {row.impressions.toLocaleString()}
                          </td>
                          <td className="py-4 pr-6 text-right text-gray-700">
                            {row.clicks.toLocaleString()}
                          </td>
                          <td className="py-4 pr-6 text-right">
                            <span
                              className={`font-semibold ${isWinner ? 'text-orange-600' : 'text-gray-700'}`}
                            >
                              {row.ctr.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <span
                              className={`font-medium ${
                                row.lift.startsWith('+')
                                  ? 'text-green-600'
                                  : row.lift.startsWith('-')
                                    ? 'text-red-600'
                                    : 'text-gray-400'
                              }`}
                            >
                              {row.lift}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
