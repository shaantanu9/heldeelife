import { requireAdmin } from '@/lib/utils/auth'
import { SEOAuditClient } from './seo-audit-client'

export default async function SEOAuditPage() {
  await requireAdmin()

  return <SEOAuditClient />
}






