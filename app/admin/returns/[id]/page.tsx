import { requireAdmin } from '@/lib/utils/auth'
import { AdminReturnDetailClient } from './client'

export default async function AdminReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  return <AdminReturnDetailClient returnId={id} />
}









