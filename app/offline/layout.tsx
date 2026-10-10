import { privateMetadata } from '@/lib/seo/metadata'

export const metadata = privateMetadata('Offline', 'You are currently offline.')

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
