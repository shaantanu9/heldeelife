'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

interface Address {
  name?: string
  address?: string
  addressLine2?: string
  city?: string
  state?: string
  pincode?: string
  phone?: string
  country?: string
}

interface ShippingAddressProps {
  address: Address | null | undefined
  title?: string
  className?: string
}

export function ShippingAddress({
  address,
  title = 'Shipping Address',
  className,
}: ShippingAddressProps) {
  if (!address) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No address provided</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-gray-600 space-y-1">
          {address.name && (
            <p className="font-semibold text-gray-900">{address.name}</p>
          )}
          {address.address && <p>{address.address}</p>}
          {address.addressLine2 && <p>{address.addressLine2}</p>}
          {(address.city || address.state || address.pincode) && (
            <p>
              {[address.city, address.state, address.pincode]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
          {address.country && <p>{address.country}</p>}
          {address.phone && (
            <p className="mt-2 text-sm">
              <span className="font-semibold">Phone:</span> {address.phone}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}









