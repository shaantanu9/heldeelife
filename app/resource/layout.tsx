import { buildMetadata } from '@/lib/seo/metadata'

// Placeholder hub until the downloadable guides exist — keep it out of the
// index (thin content) but let crawlers follow its links.
export const metadata = buildMetadata({
  title: 'Ayurveda & Wellness Resources',
  description:
    'Guides and articles on Ayurveda, respiratory health, immunity and seasonal wellness from heldeelife.',
  path: '/resource',
  noIndex: true,
})

export default function ResourceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
