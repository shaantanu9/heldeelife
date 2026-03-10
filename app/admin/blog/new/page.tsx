import { requireAdmin } from '@/lib/utils/auth'
import { NewBlogPostClient } from './client'

export default async function NewBlogPostPage() {
  await requireAdmin()

  return <NewBlogPostClient />
}
