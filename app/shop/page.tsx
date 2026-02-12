import { Suspense } from 'react'
import { getProducts, getProductCategories } from '@/lib/api/server'
import { ShopClient } from './shop-client'
import { Metadata } from 'next'
import { Loader2 } from 'lucide-react'

// Route segment config for ISR
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shop - heldeelife',
  description: 'Browse our collection of Ayurveda and modern medicine products',
  openGraph: {
    title: 'Shop - heldeelife',
    description:
      'Browse our collection of Ayurveda and modern medicine products',
    type: 'website',
  },
}

// Loading component
function ShopLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </div>
    </div>
  )
}

async function ShopContent({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    search?: string
    minPrice?: string
    maxPrice?: string
    inStock?: string
    sort?: string
  }>
}) {
  const params = await searchParams
  const category = params.category || undefined
  const search = params.search || undefined

  // Fetch data on the server with Next.js caching
  // Note: Price range, stock, and sort filters are handled client-side
  // for better UX and to avoid unnecessary server requests
  const [products, categories] = await Promise.all([
    getProducts({ category, search }),
    getProductCategories(),
  ])

  return <ShopClient products={products} categories={categories} />
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    search?: string
    minPrice?: string
    maxPrice?: string
    inStock?: string
    sort?: string
  }>
}) {
  return (
    <Suspense fallback={<ShopLoading />}>
      <ShopContent searchParams={searchParams} />
    </Suspense>
  )
}
