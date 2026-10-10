import { buildMetadata } from '@/lib/seo/metadata'

// Internal search results should not be indexed (Google webmaster guidelines),
// but links on the page should still be followed.
export const metadata = buildMetadata({
  title: 'Search Products & Articles',
  description:
    'Search heldeelife for Ayurvedic products, wellness articles and health insights.',
  path: '/search',
  noIndex: true,
})

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
