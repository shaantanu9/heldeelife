import { requireAdmin } from '@/lib/utils/auth'
import { AdminBlogCategoriesClient } from './client'

export default async function AdminBlogCategoriesPage() {
  await requireAdmin()

  return <AdminBlogCategoriesClient />
}









