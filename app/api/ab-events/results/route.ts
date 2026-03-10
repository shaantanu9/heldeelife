import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

type AbRow = { variant_id: string; event_type: string; count: number }

type SignificanceResult =
  | { variant_id: string; z_score: number; p_value: number; significant: boolean; lift_pct: number }
  | { variant_id: string; insufficient_data: true }

// erfc via Horner's method, 8-term polynomial (Numerical Recipes §6.2, max |err| < 1.2e-7)
function erfc(x: number): number {
  const t = 1.0 / (1.0 + 0.5 * Math.abs(x))
  const tau = t * Math.exp(
    -x * x - 1.26551223
    + t * (1.00002368
    + t * (0.37409196
    + t * (0.09678418
    + t * (-0.18628806
    + t * (0.27886807
    + t * (-1.13520398
    + t * (1.48851587
    + t * (-0.82215223
    + t * 0.17087294))))))))
  )
  return x >= 0 ? tau : 2.0 - tau
}

function calculateSignificance(results: AbRow[]): SignificanceResult[] {
  // Aggregate per-variant impression and click counts from flat rows
  const shown: Record<string, number> = {}
  const clicked: Record<string, number> = {}

  for (const row of results) {
    if (row.event_type === 'variant_shown') shown[row.variant_id] = (shown[row.variant_id] ?? 0) + row.count
    if (row.event_type === 'cta_clicked') clicked[row.variant_id] = (clicked[row.variant_id] ?? 0) + row.count
  }

  const controlId = 'control'
  const n_control = shown[controlId] ?? 0
  const cta_control = clicked[controlId] ?? 0

  return Object.keys(shown)
    .filter(id => id !== controlId)
    .map(id => {
      const n_variant = shown[id] ?? 0
      const cta_variant = clicked[id] ?? 0

      // Insufficient sample — skip significance
      if (n_variant < 30 || n_control < 30) {
        return { variant_id: id, insufficient_data: true as const }
      }

      const p1 = cta_variant / n_variant
      const p2 = cta_control / n_control
      const p_pool = (cta_variant + cta_control) / (n_variant + n_control)
      const se = Math.sqrt(p_pool * (1 - p_pool) * (1 / n_variant + 1 / n_control))

      // Division by zero guard
      if (se === 0) {
        return { variant_id: id, insufficient_data: true as const }
      }

      const z = (p1 - p2) / se
      const p_value = erfc(Math.abs(z) / Math.SQRT2)
      const lift_pct = p2 > 0 ? Math.round(((p1 - p2) / p2) * 1000) / 10 : 0

      return {
        variant_id: id,
        z_score: Math.round(z * 100) / 100,
        p_value: Math.round(p_value * 10000) / 10000,
        significant: p_value < 0.05,
        lift_pct,
      }
    })
}

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // SQL GROUP BY aggregation via stored function (avoids fetching all rows into JS)
    const { data, error } = await supabaseAdmin.rpc('get_ab_event_counts')

    if (error) {
      console.error('Error fetching ab events:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Return flat array: [{ variant_id, event_type, count }]
    const results = (data || []).map((row: { variant_id: string; event_type: string; count: number | string }) => ({
      variant_id: row.variant_id,
      event_type: row.event_type,
      count: Number(row.count),
    }))

    const significance = calculateSignificance(results)

    return NextResponse.json({ results, significance })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
