import { supabaseAdmin } from '@/lib/supabase/server'
import { SITE, SITE_URL } from '@/lib/seo/site'

/**
 * /llms.txt — a Markdown summary of the site for LLMs and AI answer engines
 * (https://llmstxt.org). It gives Generative Engine Optimization (GEO)
 * crawlers verified facts, policies and canonical links in one fetch.
 */
export const revalidate = 3600

const oneLine = (text?: string | null, max = 180) => {
  const clean = (text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

async function safe<T>(query: () => PromiseLike<{ data: T[] | null }>) {
  try {
    const { data } = await query()
    return data || []
  } catch {
    return []
  }
}

export async function GET() {
  const [products, posts] = await Promise.all([
    safe<{
      name: string
      slug: string
      price: number
      short_description: string | null
      description: string | null
      product_categories: { name: string } | null
    }>(
      () =>
        supabaseAdmin
          .from('products')
          .select(
            'name, slug, price, short_description, description, product_categories(name)'
          )
          .eq('is_active', true)
          .not('slug', 'is', null)
          .order('is_featured', { ascending: false })
          .order('sales_count', { ascending: false })
          .limit(50) as any
    ),
    safe<{ title: string; slug: string; excerpt: string | null }>(() =>
      supabaseAdmin
        .from('blog_posts')
        .select('title, slug, excerpt')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(50)
    ),
  ])

  const { policies, contact, address } = SITE

  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    '## Key facts',
    '',
    `- Website: ${SITE_URL}`,
    `- Business type: Online store (Ayurvedic and modern wellness products) with doctor consultations`,
    `- Based in: ${address.addressLocality}, ${address.addressRegion}, India`,
    `- Ships to: All of India (no international shipping yet)`,
    `- Currency: Indian Rupee (INR, ₹)`,
    `- Shipping: Free on orders above ₹${policies.freeShippingThreshold}; ₹${policies.shippingCharge} below that. Delivery in ${policies.transitDays.min}–${policies.transitDays.max} business days depending on location.`,
    `- Returns: ${policies.returnDays}-day return window from delivery; unopened products in original packaging (defective items always accepted).`,
    `- Payments: Credit/debit cards, UPI, net banking and wallets via Razorpay.`,
    `- Support: ${contact.email} · ${contact.phone} · ${contact.hoursLabel}`,
    '',
    '## Main pages',
    '',
    `- [Shop all products](${SITE_URL}/shop): Full catalogue of Ayurvedic and wellness products`,
    `- [Book a consultation](${SITE_URL}/service): General, Ayurvedic, allergy and respiratory consultations, online or in person`,
    `- [Blog](${SITE_URL}/blog): Articles on Ayurveda, immunity and respiratory health`,
    `- [FAQ](${SITE_URL}/faq): Answers about products, shipping, returns, consultations and payments`,
    `- [About](${SITE_URL}/about): Who we are and our approach`,
    `- [Contact](${SITE_URL}/contact): Customer support details`,
    '',
    '## Policies',
    '',
    `- [Shipping policy](${SITE_URL}/shipping)`,
    `- [Refund & return policy](${SITE_URL}/refund)`,
    `- [Privacy policy](${SITE_URL}/privacy)`,
    `- [Terms of service](${SITE_URL}/terms)`,
  ]

  if (products.length > 0) {
    lines.push('', '## Products', '')
    for (const p of products) {
      const category = p.product_categories?.name
      const summary = oneLine(p.short_description || p.description)
      lines.push(
        `- [${p.name}](${SITE_URL}/products/${p.slug}): ₹${Number(p.price).toFixed(0)}${
          category ? ` · ${category}` : ''
        }${summary ? ` — ${summary}` : ''}`
      )
    }
  }

  if (posts.length > 0) {
    lines.push('', '## Articles', '')
    for (const post of posts) {
      const summary = oneLine(post.excerpt)
      lines.push(
        `- [${post.title}](${SITE_URL}/blog/${post.slug}/markdown)${summary ? `: ${summary}` : ''}`
      )
    }
  }

  lines.push(
    '',
    '## Optional',
    '',
    `- [Sitemap](${SITE_URL}/sitemap.xml)`,
    `- [RSS feed](${SITE_URL}/rss.xml)`,
    '',
    '_Product information is for general wellness purposes and is not a substitute for professional medical advice._',
    ''
  )

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
