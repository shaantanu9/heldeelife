/**
 * Generate static params for product pages
 * Pre-renders popular products at build time using slugs
 * This enables static generation for SEO and LLM accessibility
 */

import { supabaseAdmin } from '@/lib/supabase/server'

export async function generateStaticParams() {
  try {
    // Fetch featured and popular products for static generation
    // This pre-renders the most important products at build time
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('slug')
      .eq('is_active', true)
      .or('is_featured.eq.true,views_count.gt.100,sales_count.gt.10')
      .order('views_count', { ascending: false })
      .order('sales_count', { ascending: false })
      .limit(50) // Pre-render top 50 products

    if (!products || products.length === 0) {
      // Fallback: get all active products with slugs
      const { data: allProducts } = await supabaseAdmin
        .from('products')
        .select('slug')
        .eq('is_active', true)
        .not('slug', 'is', null)
        .limit(100)

      return (allProducts || []).map((product) => ({
        slug: product.slug,
      }))
    }

    return products
      .filter((product) => product.slug) // Ensure slug exists
      .map((product) => ({
        slug: product.slug,
      }))
  } catch (error) {
    console.error('Error generating static params for products:', error)
    return []
  }
}
