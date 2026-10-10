import { describe, it, expect } from 'vitest'
import { serializeJsonLd } from '@/lib/seo/json-ld'
import {
  breadcrumbSchema,
  faqSchema,
  organizationSchema,
  productSchema,
} from '@/lib/seo/schema'
import { buildMetadata, clampDescription } from '@/lib/seo/metadata'
import { absoluteUrl, SITE_URL } from '@/lib/seo/site'
import robots from '@/app/robots'

describe('serializeJsonLd', () => {
  it('escapes characters that could close the <script> tag', () => {
    const out = serializeJsonLd({ name: '</script><script>alert(1)</script>' })
    expect(out).not.toContain('</script>')
    expect(out).not.toContain('<')
    expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>')
  })

  it('drops null, undefined, empty strings and empty arrays', () => {
    const out = JSON.parse(
      serializeJsonLd({ a: null, b: undefined, c: '', d: [], e: { f: null }, g: 0 })
    )
    expect(out).toEqual({ '@context': 'https://schema.org', g: 0 })
  })

  it('wraps arrays in a single @graph without per-node @context', () => {
    const out = JSON.parse(
      serializeJsonLd([
        { '@context': 'https://schema.org', '@type': 'A' },
        { '@type': 'B' },
      ])
    )
    expect(out['@context']).toBe('https://schema.org')
    expect(out['@graph']).toEqual([{ '@type': 'A' }, { '@type': 'B' }])
  })
})

describe('schema builders', () => {
  const product = {
    id: 'p1',
    name: 'Tulsi Drops',
    slug: 'tulsi-drops',
    description: '<p>Herbal <b>immunity</b> drops</p>',
    price: '349.5',
    image: 'https://ik.imagekit.io/x/tulsi.jpg',
    images: ['🌿', 'https://ik.imagekit.io/x/tulsi.jpg'],
    inStock: true,
    rating: 4.4,
    reviews_count: 0,
  }

  it('builds a valid Product with offer, shipping and return policy', () => {
    const node = productSchema(product) as any
    expect(node['@type']).toBe('Product')
    expect(node.url).toBe(`${SITE_URL}/products/tulsi-drops`)
    expect(node.description).toBe('Herbal immunity drops')
    // non-URL and duplicate images are removed
    expect(node.image).toEqual(['https://ik.imagekit.io/x/tulsi.jpg'])
    expect(node.offers.price).toBe('349.50')
    expect(node.offers.availability).toBe('https://schema.org/InStock')
    expect(node.offers.shippingDetails.shippingRate.value).toBe(50)
    expect(node.offers.priceValidUntil).toMatch(/^\d{4}-12-31$/)
  })

  it('omits aggregateRating when there are no reviews', () => {
    expect((productSchema(product) as any).aggregateRating).toBeUndefined()
    const rated = productSchema({ ...product, reviews_count: 12 }) as any
    expect(rated.aggregateRating).toMatchObject({ ratingValue: '4.4', reviewCount: 12 })
  })

  it('gives free shipping above the threshold', () => {
    const node = productSchema({ ...product, price: 999 }) as any
    expect(node.offers.shippingDetails.shippingRate.value).toBe(0)
  })

  it('builds breadcrumbs with absolute URLs and positions', () => {
    const node = breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Shop', path: '/shop' },
    ]) as any
    expect(node.itemListElement[1]).toMatchObject({
      position: 2,
      item: `${SITE_URL}/shop`,
    })
  })

  it('strips HTML from FAQ answers', () => {
    const node = faqSchema([{ question: 'Q?', answer: '<p>Yes</p>' }]) as any
    expect(node.mainEntity[0].acceptedAnswer.text).toBe('Yes')
  })

  it('organization exposes a stable @id and contact point', () => {
    const node = organizationSchema() as any
    expect(node['@id']).toBe(`${SITE_URL}/#organization`)
    expect(node.contactPoint[0].email).toBeTruthy()
  })
})

describe('metadata helpers', () => {
  it('sets canonical, hreflang and og:url from the path', () => {
    const meta = buildMetadata({ title: 'FAQ', description: 'x'.repeat(50), path: '/faq' })
    expect(meta.alternates?.canonical).toBe('/faq')
    expect(meta.alternates?.languages).toMatchObject({ 'en-IN': '/faq' })
    expect((meta.openGraph as any).url).toBe('/faq')
    expect((meta.openGraph as any).locale).toBe('en_IN')
  })

  it('keeps explicit index directives on indexable pages', () => {
    // A robots: undefined key would wipe the root layout's directives.
    const meta = buildMetadata({ title: 'A', description: 'd', path: '/a' })
    expect(meta.robots).toMatchObject({
      index: true,
      googleBot: { 'max-image-preview': 'large' },
    })
  })

  it('marks noIndex pages as noindex but followable', () => {
    const meta = buildMetadata({ title: 'S', description: 'd', path: '/search', noIndex: true })
    expect(meta.robots).toMatchObject({ index: false, follow: true })
  })

  it('clamps long descriptions on a word boundary', () => {
    const out = clampDescription('word '.repeat(60))
    expect(out.length).toBeLessThanOrEqual(160)
    expect(out.endsWith('…')).toBe(true)
  })

  it('absoluteUrl leaves absolute URLs alone', () => {
    expect(absoluteUrl('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg')
    expect(absoluteUrl('faq')).toBe(`${SITE_URL}/faq`)
  })
})

describe('robots', () => {
  it('blocks private paths in every user-agent group', () => {
    const { rules } = robots()
    const groups = Array.isArray(rules) ? rules : [rules]
    expect(groups.length).toBeGreaterThan(1)
    for (const group of groups) {
      expect(group.disallow).toEqual(expect.arrayContaining(['/checkout', '/profile', '/admin/']))
    }
  })

  it('explicitly allows AI answer-engine crawlers', () => {
    const { rules } = robots()
    const groups = Array.isArray(rules) ? rules : [rules]
    const agents = groups.flatMap((g) => [g.userAgent].flat())
    expect(agents).toEqual(expect.arrayContaining(['GPTBot', 'PerplexityBot', 'ClaudeBot']))
  })
})
