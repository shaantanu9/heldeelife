import { requireAdmin } from '@/lib/utils/auth'
import { AdminReturnsClient } from './client'

export default async function AdminReturnsPage() {
  await requireAdmin()

  return <AdminReturnsClient />
}









