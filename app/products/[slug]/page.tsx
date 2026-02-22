import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Link2 } from 'lucide-react'
import Link from 'next/link'
import { getProduct, getProducts } from '@/lib/api/server'
import { ProductEnhanced } from './product-enhanced'
import { ProductImageGallery } from './product-image-gallery'
import { ProductSocialShare } from './product-social-share'
import { ProductSpecifications } from './product-specifications'
import { ProductRecommendations } from '@/components/conversion/product-recommendations'
import { ProductBundles } from '@/components/conversion/product-bundles'
import dynamic from 'next/dynamic'

// Lazy load below-the-fold components
const ProductReviews = dynamic(
  () =>
    import('./product-reviews').then((mod) => ({
      default: mod.ProductReviews,
    })),
  {
    loading: () => <div className="py-12 bg-white" />,
    ssr: true,
  }
)

const ProductVideos = dynamic(
  () =>
    import('./product-videos').then((mod) => ({ default: mod.ProductVideos })),
  {
    loading: () => <div className="py-12 bg-white" />,
    ssr: true,
  }
)
import { MobileProductDetail } from '@/components/products/mobile-product-detail'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import Image from 'next/image'
import type { Metadata } from 'next'

// Helper function to check if a string is a valid URL
function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  // Check if it's a valid URL (http:// or https://)
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    // If URL parsing fails, it's not a valid URL (could be an emoji or relative path)
    return false
  }
}

// Route segment config for ISR (Incremental Static Regeneration)
// Revalidate every 60 seconds for real-time data updates
// This ensures static pages stay fresh while maintaining SEO benefits
export const revalidate = 60
// Use dynamic rendering when needed, but prefer static generation
export const dynamicParams = true // Allow dynamic params not in generateStaticParams

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

// Pre-generate static pages for all active products at build time
export async function generateStaticParams() {
  const { supabaseAdmin } = await import('@/lib/supabase/server')
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('slug')
    .eq('is_active', true)
    .not('slug', 'is', null)

  return (products || [])
    .filter((p) => p.slug)
    .map((product) => ({ slug: product.slug }))
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  const title = product.meta_title || product.name
  const description =
    product.meta_description ||
    product.short_description ||
    product.description ||
    ''
  const keywords = product.meta_keywords?.join(', ') || ''

  return {
    title,
    description,
    keywords: keywords || undefined,
    openGraph: {
      title,
      description,
      images: product.image
        ? [product.image, ...(product.images || []).slice(0, 3)]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.image ? [product.image] : [],
    },
    alternates: {
      canonical: `${
        process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'
      }/products/${product.slug}`,
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  // If product was found by UUID but has a slug, ensure we're using the slug URL
  // This prevents duplicate content issues and ensures proper SEO
  if (product.slug && slug !== product.slug) {
    const { redirect } = await import('next/navigation')
    redirect(`/products/${product.slug}`)
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'

  // Generate comprehensive structured data for SEO and LLM visibility
  // This ensures Google, Bing, and LLMs can properly understand and index the product
  const productUrl = `${baseUrl}/products/${product.slug}`
  const productImages = product.image
    ? [product.image, ...(product.images || []).filter(Boolean)]
    : []

  // Extract clean text content for LLM understanding (remove HTML if any)
  const cleanDescription = (
    product.meta_description ||
    product.short_description ||
    product.description ||
    ''
  )
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': productUrl,
    name: product.name,
    description: cleanDescription,
    image: productImages.length > 0 ? productImages : undefined,
    sku: product.sku || undefined,
    mpn: product.sku || undefined, // Manufacturer Part Number
    brand: product.manufacturer
      ? {
          '@type': 'Brand',
          name: product.manufacturer,
        }
      : undefined,
    category: product.product_categories?.name || undefined,
    productID: product.id,
    url: productUrl,
    offers: {
      '@type': 'Offer',
      price: Number(product.price),
      priceCurrency: 'INR',
      availability:
        product.inStock || product.stockQuantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: productUrl,
      priceValidUntil: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString(), // Valid for 1 year
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'heldeelife',
        url: baseUrl,
      },
    },
    ...(product.rating &&
      product.rating > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: Number(product.rating),
          reviewCount: product.reviews_count || 0,
          bestRating: 5,
          worstRating: 1,
        },
      }),
    ...(product.benefits &&
      product.benefits.length > 0 && {
        additionalProperty: product.benefits.map((benefit: string) => ({
          '@type': 'PropertyValue',
          name: 'Benefit',
          value: benefit,
        })),
      }),
    ...(product.ingredients && {
      material: product.ingredients,
    }),
    ...(product.usage_instructions && {
      usageInfo: product.usage_instructions,
    }),
    ...(product.storage_instructions && {
      storageRequirements: product.storage_instructions,
    }),
    ...(product.faq &&
      product.faq.length > 0 && {
        mainEntity: {
          '@type': 'FAQPage',
          mainEntity: product.faq.map((faq: any) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        },
      }),
    ...(product.blog_links &&
      product.blog_links.length > 0 && {
        relatedLink: product.blog_links.map((link: any) => ({
          '@type': link.type === 'internal' ? 'Article' : 'WebPage',
          url: link.type === 'internal' ? `${baseUrl}${link.url}` : link.url,
          name: link.title || link.url,
        })),
      }),
    // Additional LLM-friendly fields
    ...(product.short_description && {
      disambiguatingDescription: product.short_description,
    }),
  }

  // Get related products (same category, limit 4)
  const relatedProducts =
    product.product_categories?.id && product.product_categories?.slug
      ? await getProducts({
          category: product.product_categories.slug,
          limit: 4,
        }).catch((error) => {
          console.error('Error fetching related products:', error)
          return []
        })
      : []
  const filteredRelated = relatedProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 3)

  // Safely stringify structured data, removing undefined values
  const cleanStructuredData = JSON.parse(
    JSON.stringify(structuredData, (key, value) =>
      value === undefined ? null : value
    )
  )

  return (
    <>
      {/* Structured Data for SEO and LLM */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(cleanStructuredData),
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-4 md:py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          {/* Breadcrumb Navigation - Improved Alignment and Flow */}
          <div className="mb-4 md:mb-6">
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList className="items-center">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="mx-1.5" />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/shop"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    Shop
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {product.product_categories && (
                  <>
                    <BreadcrumbSeparator className="mx-1.5" />
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href={`/shop?category=${product.product_categories.slug}`}
                        className="text-gray-600 hover:text-orange-600 transition-colors"
                      >
                        {product.product_categories.name}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
                <BreadcrumbSeparator className="mx-1.5" />
                <BreadcrumbItem className="max-w-[400px]">
                  <BreadcrumbPage className="text-gray-900 font-medium truncate">
                    {product.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Mobile Breadcrumb - Simplified */}
            <div className="md:hidden flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-1 hover:text-orange-600 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Shop</span>
              </Link>
              {product.product_categories && (
                <>
                  <span className="text-gray-400">/</span>
                  <Link
                    href={`/shop?category=${product.product_categories.slug}`}
                    className="hover:text-orange-600 transition-colors truncate max-w-[120px]"
                  >
                    {product.product_categories.name}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Back to Shop Link - Desktop Only */}
          <Link
            href="/shop"
            className="hidden md:inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Shop</span>
          </Link>

          {/* Mobile-Optimized Product Detail */}
          <div className="md:hidden mb-16">
            <MobileProductDetail
              product={{
                id: product.id,
                product_id: product.id,
                name: product.name,
                price: product.price,
                compare_at_price: product.compare_at_price || undefined,
                image: product.image || '📦',
                images: product.images || [],
                inStock: product.inStock || false,
                stockQuantity: product.stockQuantity || 0,
                rating: product.rating || undefined,
                reviews_count: product.reviews_count || undefined,
                sales_count: product.sales_count || undefined,
                short_description: product.short_description || undefined,
                sku: product.sku,
              }}
            />
          </div>

          {/* Desktop Product Layout */}
          <div className="hidden md:block mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
              {/* Product Image Gallery with Zoom */}
              <div className="w-full">
                <ProductImageGallery
                  mainImage={product.image}
                  images={product.images || []}
                  productName={product.name}
                />
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="text-sm text-orange-600 uppercase tracking-wide font-semibold">
                      {product.product_categories?.name || 'Uncategorized'}
                    </p>
                    <ProductSocialShare
                      productName={product.name}
                      productUrl={`${baseUrl}/products/${product.slug}`}
                      productImage={product.image || undefined}
                      productDescription={
                        product.short_description ||
                        product.description ||
                        undefined
                      }
                    />
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {product.name}
                  </h1>
                </div>

                {(product.description || product.short_description) && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">
                      Description
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                      {product.description ||
                        product.short_description ||
                        'No description available.'}
                    </p>
                  </div>
                )}

                {product.benefits && product.benefits.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">
                      Key Benefits
                    </h2>
                    <ul className="space-y-2">
                      {product.benefits.map((benefit: string, index: number) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-gray-600"
                        >
                          <span className="text-orange-600 mt-1 flex-shrink-0">
                            ✓
                          </span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Enhanced Client Component with Psychology */}
                <ProductEnhanced
                  product={{
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    compare_at_price: product.compare_at_price || undefined,
                    image: product.image || '📦',
                    images: product.images || [],
                    inStock: product.inStock || false,
                    stockQuantity: product.stockQuantity || 0,
                    rating: product.rating || undefined,
                    reviews_count: product.reviews_count || undefined,
                    sales_count: product.sales_count || undefined,
                    views_count: product.views_count || undefined,
                  }}
                />

                {/* Product Specifications Table */}
                <ProductSpecifications
                  product={{
                    sku: product.sku,
                    manufacturer: product.manufacturer,
                    expiry_info: product.expiry_info,
                    weight: product.weight,
                    dimensions: product.dimensions,
                    ingredients: product.ingredients,
                    usage_instructions: product.usage_instructions,
                    storage_instructions: product.storage_instructions,
                    tags: product.tags,
                  }}
                />

                {/* Product Information (Detailed) - Desktop */}
                {(product.ingredients ||
                  product.usage_instructions ||
                  product.storage_instructions) && (
                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    {product.ingredients && (
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">
                          Ingredients
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {product.ingredients}
                        </p>
                      </div>
                    )}
                    {product.usage_instructions && (
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">
                          Usage Instructions
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {product.usage_instructions}
                        </p>
                      </div>
                    )}
                    {product.storage_instructions && (
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">
                          Storage
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {product.storage_instructions}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Blog Links Section */}
          {product.blog_links && product.blog_links.length > 0 && (
            <div className="max-w-6xl mx-auto mb-16 px-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {product.blog_links.map((link: any, index: number) => (
                  <Link
                    key={index}
                    href={link.type === 'internal' ? link.url : link.url}
                    target={link.type === 'external' ? '_blank' : undefined}
                    rel={
                      link.type === 'external'
                        ? 'noopener noreferrer'
                        : undefined
                    }
                    className="group block"
                  >
                    <Card className="border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white h-full">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <Link2 className="h-5 w-5 text-orange-600" />
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                            {link.type === 'internal' ? 'Internal' : 'External'}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg mb-2 text-gray-900 group-hover:text-orange-600 transition-colors">
                          {link.title || link.url}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {link.url}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Section */}
          {product.faq && product.faq.length > 0 && (
            <div className="max-w-6xl mx-auto mb-16 px-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {product.faq.map((faq: any, index: number) => (
                  <Card key={index} className="border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-3 text-gray-900">
                        {faq.question}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="max-w-6xl mx-auto mb-16 px-4">
            <ProductReviews productId={product.id} productName={product.name} />
          </div>

          {/* Videos Section */}
          <div className="max-w-6xl mx-auto mb-16 px-4">
            <ProductVideos productId={product.id} productName={product.name} />
          </div>

          {/* Related Products - Enhanced with Recommendations Component */}
          <ProductRecommendations
            productId={product.id}
            categoryId={product.category_id}
            type="related"
            title="You May Also Like"
            limit={6}
            className="max-w-6xl mx-auto"
          />

          {/* Product Bundles */}
          <ProductBundles
            productId={product.id}
            categoryId={product.category_id}
            title="Buy Together and Save"
            limit={3}
            className="max-w-6xl mx-auto"
          />

          {/* Frequently Bought Together */}
          <ProductRecommendations
            productId={product.id}
            categoryId={product.category_id}
            type="frequently-bought"
            title="Frequently Bought Together"
            limit={4}
            className="max-w-6xl mx-auto"
          />
        </div>
      </div>
    </>
  )
}
