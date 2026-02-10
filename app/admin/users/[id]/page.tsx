import { requireAdmin } from '@/lib/utils/auth'
import { AdminUserDetailClient } from './client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  await requireAdmin()
  const { id } = await params
  return <AdminUserDetailClient userId={id} />
}
