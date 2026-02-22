import { Suspense } from 'react'
import { getProducts, getProductCategories } from '@/lib/api/server'
import { ShopClient } from './shop-client'
import { Metadata } from 'next'
import { Loader2 } from 'lucide-react'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'

// ISR - revalidate every 60 seconds for fresh product data
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Shop Ayurveda & Wellness Products | heldeelife',
  description:
    'Browse and shop authentic Ayurveda products, herbal remedies, immunity boosters, and modern wellness solutions. Free shipping on orders above ₹499. Trusted by 50,000+ customers.',
  keywords: [
    'buy ayurveda products',
    'ayurveda shop online',
    'herbal products india',
    'wellness products',
    'immunity booster',
    'cold relief',
    'cough remedy',
    'natural medicine',
    'heldeelife shop',
  ],
  openGraph: {
    title: 'Shop Ayurveda & Wellness Products | heldeelife',
    description:
      'Browse and shop authentic Ayurveda products, herbal remedies, and modern wellness solutions.',
    type: 'website',
    url: `${baseUrl}/shop`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop Ayurveda & Wellness Products | heldeelife',
    description:
      'Browse and shop authentic Ayurveda products, herbal remedies, and modern wellness solutions.',
  },
  alternates: {
    canonical: `${baseUrl}/shop`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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

  // Structured data for SEO and LLMs
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'heldeelife Shop - Ayurveda & Wellness Products',
    description:
      'Browse and shop authentic Ayurveda products, herbal remedies, and modern wellness solutions.',
    url: `${baseUrl}/shop`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.slice(0, 20).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          url: `${baseUrl}/products/${product.slug}`,
          image: product.image || undefined,
          description: product.short_description || product.description || '',
          offers: {
            '@type': 'Offer',
            price: Number(product.price),
            priceCurrency: 'INR',
            availability:
              product.inStock || (product.inventory && product.inventory[0]?.available_quantity > 0)
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
          },
        },
      })),
    },
    provider: {
      '@type': 'Organization',
      name: 'heldeelife',
      url: baseUrl,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
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
