import { Suspense } from 'react'
import { getProducts, getProductCategories } from '@/lib/api/server'
import { ShopClient } from './shop-client'
import { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/lib/seo/json-ld'
import { itemListSchema, webPageSchema } from '@/lib/seo/schema'
import { Loader2 } from 'lucide-react'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'

// ISR - revalidate every 60 seconds for fresh product data
export const revalidate = 60

export const metadata: Metadata = buildMetadata({
  title: 'Shop Ayurvedic & Wellness Products Online',
  description:
    'Shop authentic Ayurvedic products, herbal remedies, immunity boosters and modern wellness essentials online in India. Free shipping on orders above ₹500 and 7-day returns.',
  path: '/shop',
  keywords: [
    'buy ayurveda products online',
    'ayurvedic shop India',
    'herbal products',
    'immunity booster',
    'natural cough and cold relief',
  ],
})

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

  // Structured data for SEO and LLMs
  // Summary-style ItemList (URLs only): full Product markup lives on each
  // product page, which is what Google expects for category pages.
  const structuredData = [
    webPageSchema({
      path: '/shop',
      name: 'Shop Ayurveda & Wellness Products',
      type: 'CollectionPage',
      breadcrumb: [
        { name: 'Home', path: '/' },
        { name: 'Shop', path: '/shop' },
      ],
    }),
    itemListSchema(products.slice(0, 50), {
      name: 'heldeelife products',
      path: '/shop',
    }),
  ]

  return (
    <>
      <JsonLd data={structuredData} />
      <ShopClient products={products} categories={categories} />
    </>
  )
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
