import { requireAdmin } from '@/lib/utils/auth'
import { AdminCouponsClient } from './client'

export default async function AdminCouponsPage() {
  await requireAdmin()

  return <AdminCouponsClient />
}









