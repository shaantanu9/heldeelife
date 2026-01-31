import { requireAdmin } from '@/lib/utils/auth'
import { AdminCategoriesClient } from './client'

export default async function AdminCategoriesPage() {
  await requireAdmin()

  return <AdminCategoriesClient />
}









