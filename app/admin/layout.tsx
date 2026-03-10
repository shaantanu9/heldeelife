import { requireAdmin } from '@/lib/utils/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()
  return <>{children}</>
}
