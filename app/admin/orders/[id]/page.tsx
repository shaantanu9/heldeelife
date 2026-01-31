import { requireAdmin } from '@/lib/utils/auth'
import { AdminOrderDetailClient } from './client'

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  return <AdminOrderDetailClient orderId={id} />
}









