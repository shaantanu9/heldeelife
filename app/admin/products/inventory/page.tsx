import { requireAdmin } from '@/lib/utils/auth'
import { AdminInventoryClient } from './client'

export default async function AdminInventoryPage() {
  await requireAdmin()

  return <AdminInventoryClient />
}









