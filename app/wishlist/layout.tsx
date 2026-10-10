import { privateMetadata } from '@/lib/seo/metadata'

export const metadata = privateMetadata(
  'Wishlist',
  'Products you have saved on heldeelife.'
)

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
