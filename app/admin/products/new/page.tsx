import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/utils/auth'

/**
 * /admin/products/new - Redirects to products list with ?new=1
 * so the Add Product dialog opens automatically (handled by AdminProductsClient).
 */
export default async function AdminNewProductPage() {
  await requireAdmin()
  redirect('/admin/products?new=1')
}
