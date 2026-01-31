import { requireAdmin } from '@/lib/utils/auth'
import { AdminDashboardClient } from './dashboard-client'

export default async function AdminDashboardPage() {
  await requireAdmin()

  return <AdminDashboardClient />
}
