import { NextResponse } from 'next/server'
import { isPaymentGatewayConfigured } from '@/lib/commerce/razorpay'

// GET /api/payments/config - which payment methods checkout may offer
export async function GET() {
  return NextResponse.json(
    { online: isPaymentGatewayConfigured(), cod: true },
    { headers: { 'Cache-Control': 'public, max-age=300' } }
  )
}
