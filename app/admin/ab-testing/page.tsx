import { requireAdmin } from '@/lib/utils/auth'
import { AbTestingClient } from './ab-testing-client'

export default async function AbTestingPage() {
  await requireAdmin()

  return <AbTestingClient />
}
