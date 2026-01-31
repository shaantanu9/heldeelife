'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'
import { OrderStatusBadge } from './order-status-badge'

interface PaymentInfoProps {
  paymentMethod: string
  paymentStatus: string
  paymentTransactionId?: string
  trackingNumber?: string
  carrier?: string
  className?: string
}

export function PaymentInfo({
  paymentMethod,
  paymentStatus,
  paymentTransactionId,
  trackingNumber,
  carrier,
  className,
}: PaymentInfoProps) {
  const formatPaymentMethod = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cod':
        return 'Cash on Delivery'
      case 'online':
        return 'Online Payment'
      case 'card':
        return 'Credit/Debit Card'
      case 'upi':
        return 'UPI'
      case 'wallet':
        return 'Digital Wallet'
      default:
        return method.charAt(0).toUpperCase() + method.slice(1)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Payment Method:</span>
            <span className="font-semibold text-gray-900">
              {formatPaymentMethod(paymentMethod)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Payment Status:</span>
            <OrderStatusBadge status={paymentStatus} size="sm" />
          </div>
          {paymentTransactionId && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-sm text-gray-900">
                {paymentTransactionId}
              </span>
            </div>
          )}
          {trackingNumber && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-gray-600">Tracking Number:</span>
              <span className="font-semibold text-gray-900">
                {trackingNumber}
              </span>
            </div>
          )}
          {carrier && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Carrier:</span>
              <span className="font-semibold text-gray-900">{carrier}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}









