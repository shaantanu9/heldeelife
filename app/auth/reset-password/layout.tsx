import { privateMetadata } from '@/lib/seo/metadata'

export const metadata = privateMetadata(
  'Reset Password',
  'Choose a new password for your heldeelife account.'
)

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
