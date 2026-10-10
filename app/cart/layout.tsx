import { privateMetadata } from '@/lib/seo/metadata'

export const metadata = privateMetadata(
  'Shopping Cart',
  'Review the items in your heldeelife cart.'
)

export default function CartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
