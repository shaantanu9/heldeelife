import { requireAdmin } from '@/lib/utils/auth'
import { AdminAbandonedCartsClient } from './client'

export default async function AdminAbandonedCartsPage() {
  await requireAdmin()

  return <AdminAbandonedCartsClient />
}









