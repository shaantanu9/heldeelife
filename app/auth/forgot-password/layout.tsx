import { privateMetadata } from '@/lib/seo/metadata'

export const metadata = privateMetadata(
  'Forgot Password',
  'Reset the password for your heldeelife account.'
)

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
