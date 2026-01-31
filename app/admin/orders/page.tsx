import { requireAdmin } from '@/lib/utils/auth'
import { AdminOrdersClient } from './client'

export default async function AdminOrdersPage() {
  await requireAdmin()

  return <AdminOrdersClient />
}
