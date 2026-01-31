import { requireAdmin } from '@/lib/utils/auth'
import { AdminLoyaltyClient } from './client'

export default async function AdminLoyaltyPage() {
  await requireAdmin()

  return <AdminLoyaltyClient />
}









