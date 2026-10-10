import { privateMetadata } from '@/lib/seo/metadata'

export const metadata = privateMetadata(
  'My Orders',
  'View and track your heldeelife orders.'
)

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
