import { requireAdmin } from '@/lib/utils/auth'
import { AdminBlogClient } from './client'

export default async function AdminBlogPage() {
  await requireAdmin()

  return <AdminBlogClient />
}
