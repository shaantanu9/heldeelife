import { requireAdmin } from '@/lib/utils/auth'
import { EditBlogPostClient } from './client'

export default async function EditBlogPostPage() {
  await requireAdmin()

  return <EditBlogPostClient />
}
