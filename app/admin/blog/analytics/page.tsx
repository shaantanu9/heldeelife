import { requireAdmin } from '@/lib/utils/auth'
import { BlogAnalyticsClient } from './analytics-client'

export default async function BlogAnalyticsPage() {
  await requireAdmin()

  return <BlogAnalyticsClient />
}






