import { requireAdmin } from '@/lib/utils/auth'
import { AdminAnalyticsClient } from './client'

export default async function AdminAnalyticsPage() {
  await requireAdmin()

  return <AdminAnalyticsClient />
}









