'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface OrderSummaryProps {
  subtotal: number
  taxAmount: number
  shippingAmount: number
  discountAmount: number
  totalAmount: number
  currency?: string
  className?: string
}

export function OrderSummary({
  subtotal,
  taxAmount,
  shippingAmount,
  discountAmount,
  totalAmount,
  currency = 'INR',
  className,
}: OrderSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>- {formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Shipping</span>
            <span>
              {shippingAmount > 0 ? formatCurrency(shippingAmount) : 'Free'}
            </span>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between text-lg font-bold">
            <span className="text-gray-900">Total</span>
            <span className="text-orange-600">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}









