import { requireAdmin } from '@/lib/utils/auth'
import { AdminUsersClient } from './client'

export default async function AdminUsersPage() {
  await requireAdmin()

  return <AdminUsersClient />
}









