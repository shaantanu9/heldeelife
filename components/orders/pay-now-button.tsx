'use client'

import { useState } from 'react'
import Script from 'next/script'
import { toast } from 'sonner'
import { CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PayNowButtonProps {
  orderId: string
  orderNumber?: string
  /** Guest access token (from checkout); not needed for signed-in owners */
  accessToken?: string | null
  prefill?: { name?: string; email?: string; contact?: string }
  onPaid?: () => void
  className?: string
}

/**
 * Starts (or retries) Razorpay payment for an existing unpaid order.
 * The amount is always taken from the stored order on the server.
 */
export function PayNowButton({
  orderId,
  orderNumber,
  accessToken,
  prefill,
  onPaid,
  className,
}: PayNowButtonProps) {
  const [busy, setBusy] = useState(false)

  const pay = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, access_token: accessToken }),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok || !payload?.success) {
        throw new Error(
          payload?.error?.message ||
            'Could not start payment. Please try again.'
        )
      }

      const Razorpay = (window as any).Razorpay
      if (!Razorpay) {
        throw new Error('Payment gateway is still loading. Please try again.')
      }

      const { key_id, amount, currency, razorpay_order_id } = payload.data
      const checkout = new Razorpay({
        key: key_id,
        amount,
        currency,
        name: 'heldeelife',
        description: `Order #${orderNumber || orderId.slice(0, 8).toUpperCase()}`,
        order_id: razorpay_order_id,
        prefill,
        theme: { color: '#E55A2B' },
        handler: async (response: any) => {
          const verify = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              order_id: orderId,
              access_token: accessToken,
            }),
          })
          if (verify.ok) {
            toast.success('Payment successful', {
              description: 'Your order is confirmed.',
            })
            onPaid?.()
          } else {
            toast.error('We could not confirm your payment yet', {
              description:
                'If money was debited, your order will update automatically within a few minutes.',
            })
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      })
      checkout.open()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment failed')
      setBusy(false)
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <Button
        onClick={pay}
        disabled={busy}
        className={className ?? 'bg-orange-600 hover:bg-orange-700'}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4 mr-2" />
        )}
        Complete Payment
      </Button>
    </>
  )
}
