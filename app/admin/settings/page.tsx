import { requireAdmin } from '@/lib/utils/auth'
import { AdminSettingsClient } from './client'

export default async function AdminSettingsPage() {
  await requireAdmin()

  return <AdminSettingsClient />
}









