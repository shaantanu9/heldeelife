import { privateMetadata } from '@/lib/seo/metadata'

export const metadata = privateMetadata(
  'Sign In',
  'Sign in to your heldeelife account to track orders, manage your wishlist and check out faster.'
)

export default function SigninLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
