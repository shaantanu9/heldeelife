import Script from 'next/script'
import { privateMetadata } from '@/lib/seo/metadata'

export const metadata = privateMetadata(
  'Secure Checkout',
  'Complete your heldeelife order securely.'
)

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Payment SDK is only needed here — keep it off every other page */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      {children}
    </>
  )
}
