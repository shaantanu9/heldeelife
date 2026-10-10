import { privateMetadata } from '@/lib/seo/metadata'

export const metadata = privateMetadata(
  'Compare Products',
  'Compare heldeelife products side by side.'
)

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
