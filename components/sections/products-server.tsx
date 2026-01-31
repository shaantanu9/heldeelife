import { Suspense } from 'react'
import { getProducts } from '@/lib/api/server'
import { ProductsClient } from './products-client'
import { ProductGridSkeleton } from '@/components/mobile/skeleton-loaders'

function ProductsLoading() {
  return (
    <section className="py-12 md:py-24 bg-white">
      <div className="container px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8 md:mb-16 tracking-tight">
          Recommended <span className="text-orange-600">Products</span>
        </h2>
        <ProductGridSkeleton count={6} />
      </div>
    </section>
  )
}

async function ProductsContent() {
  // Fetch featured products on the server
  const products = await getProducts({ featured: true, limit: 12 })

  return <ProductsClient products={products} />
}

export function Products() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent />
    </Suspense>
  )
}
