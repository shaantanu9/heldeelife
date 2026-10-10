import { privateMetadata } from '@/lib/seo/metadata'

export const metadata = privateMetadata(
  'Create Account',
  'Create a heldeelife account for faster checkout, order tracking and exclusive wellness offers.'
)

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
