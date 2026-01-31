import { requireAdmin } from '@/lib/utils/auth'
import { AdminReviewsClient } from './client'

export default async function AdminReviewsPage() {
  await requireAdmin()

  return <AdminReviewsClient />
}









