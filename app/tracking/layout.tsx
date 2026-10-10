import { privateMetadata } from '@/lib/seo/metadata'

export const metadata = privateMetadata(
  'Track Your Order',
  'Track the delivery status of your heldeelife order.'
)

export default function TrackingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
