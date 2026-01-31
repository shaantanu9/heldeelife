import { requireAdmin } from '@/lib/utils/auth'
import { AdminProductsClient } from './client'

export default async function AdminProductsPage() {
  await requireAdmin()

  return <AdminProductsClient />
}
