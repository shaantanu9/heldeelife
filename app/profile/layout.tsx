import { privateMetadata } from '@/lib/seo/metadata'

export const metadata = privateMetadata(
  'My Account',
  'Manage your heldeelife profile, addresses, payments and orders.'
)

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
