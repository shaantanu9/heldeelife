'use client'

import { useEffect, useState } from 'react'
import { ProductEmbed } from './product-embed'
import { extractProductIds } from '@/lib/utils/blog-content'

interface BlogContentWithProductsProps {
  content: string
  className?: string
}

interface ProductData {
  id: string
  name: string
  slug: string
  price: number
  images?: string[]
  short_description?: string
  product_categories?: {
    name: string
  }
}

export function BlogContentWithProducts({
  content,
  className = '',
}: BlogContentWithProductsProps) {
  const [processedContent, setProcessedContent] = useState(content)
  const [productDataMap, setProductDataMap] = useState<
    Map<string, ProductData>
  >(new Map())

  useEffect(() => {
    // Extract product IDs from content
    const productIds = extractProductIds(content)
    if (productIds.length === 0) {
      setProcessedContent(content)
      return
    }

    // Fetch product data
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          `/api/products?limit=100&search=${productIds.join(',')}`
        )
        const data = await response.json()
        const products = data.products || []

        // Create a map of product data
        const map = new Map<string, ProductData>()
        products.forEach((product: any) => {
          if (productIds.includes(product.id)) {
            map.set(product.id, {
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              images: product.images,
              short_description: product.short_description,
              product_categories: product.product_categories,
            })
          }
        })

        setProductDataMap(map)

        // Replace product embeds with placeholders
        let processed = content
        productIds.forEach((productId) => {
          const product = map.get(productId)
          if (product) {
            // Replace the embed div with a placeholder that we'll render
            const embedRegex = new RegExp(
              `<div[^>]*class\\s*=\\s*["']blog-product-embed["'][^>]*data-product-id\\s*=\\s*["']${productId}["'][^>]*>.*?</div>`,
              'gs'
            )
            processed = processed.replace(
              embedRegex,
              `<div data-product-embed-id="${productId}" class="product-embed-placeholder"></div>`
            )
          }
        })

        setProcessedContent(processed)
      } catch (error) {
        console.error('Error fetching products:', error)
        setProcessedContent(content)
      }
    }

    fetchProducts()
  }, [content])

  return (
    <div className={className}>
      <div
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
      {/* Render product embeds */}
      {Array.from(productDataMap.entries()).map(([productId, product]) => (
        <div key={productId} data-product-embed-id={productId} className="my-8">
          <ProductEmbed
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            productPrice={product.price}
            productImage={product.images?.[0]}
            productDescription={product.short_description}
            productCategory={product.product_categories?.name}
          />
        </div>
      ))}
    </div>
  )
}








