import { requireAdmin } from '@/lib/utils/auth'
import { AdminBlogTagsClient } from './client'

export default async function AdminBlogTagsPage() {
  await requireAdmin()

  return <AdminBlogTagsClient />
}









