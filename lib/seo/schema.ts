/**
 * schema.org builders. Every node links back to the shared Organization /
 * WebSite entities via @id, so search engines and AI answer engines resolve
 * one consistent "heldeelife" entity across the whole site.
 */

import { SITE, SCHEMA_IDS, absoluteUrl } from './site'

type Node = Record<string, unknown>

const stripHtml = (html?: string | null): string =>
  (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export function postalAddress(): Node {
  return { '@type': 'PostalAddress', ...SITE.address }
}

export function organizationSchema(): Node {
  return {
    '@type': ['Organization', 'OnlineStore'],
    '@id': SCHEMA_IDS.organization,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    description: SITE.description,
    slogan: SITE.tagline,
    foundingDate: SITE.foundingDate,
    logo: {
      '@type': 'ImageObject',
      '@id': SCHEMA_IDS.logo,
      url: SITE.logo,
      width: 512,
      height: 512,
      caption: SITE.name,
    },
    image: SITE.ogImage,
    email: SITE.contact.email,
    telephone: SITE.contact.phone,
    address: postalAddress(),
    areaServed: { '@type': 'Country', name: SITE.areaServed },
    knowsAbout: [
      'Ayurveda',
      'Ayurvedic medicine',
      'Herbal remedies',
      'Immunity',
      'Respiratory health',
      'Holistic wellness',
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: SITE.contact.email,
        telephone: SITE.contact.phone,
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi'],
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ],
          opens: '09:00',
          closes: '18:00',
        },
      },
    ],
    hasMerchantReturnPolicy: merchantReturnPolicySchema(),
    sameAs: SITE.social.length > 0 ? [...SITE.social] : undefined,
  }
}

export function websiteSchema(): Node {
  return {
    '@type': 'WebSite',
    '@id': SCHEMA_IDS.website,
    url: SITE.url,
    name: SITE.name,
    alternateName: 'heldee life',
    description: SITE.description,
    inLanguage: SITE.language,
    publisher: { '@id': SCHEMA_IDS.organization },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function webPageSchema({
  path,
  name,
  description,
  type = 'WebPage',
  breadcrumb,
  extra,
}: {
  path: string
  name: string
  description?: string
  type?:
    | 'WebPage'
    | 'AboutPage'
    | 'ContactPage'
    | 'FAQPage'
    | 'CollectionPage'
    | 'SearchResultsPage'
  breadcrumb?: Array<{ name: string; path: string }>
  extra?: Node
}): Node {
  const url = absoluteUrl(path)
  return {
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: SITE.language,
    isPartOf: { '@id': SCHEMA_IDS.website },
    about: { '@id': SCHEMA_IDS.organization },
    publisher: { '@id': SCHEMA_IDS.organization },
    ...(breadcrumb && { breadcrumb: breadcrumbSchema(breadcrumb) }),
    ...extra,
  }
}

export function breadcrumbSchema(
  items: Array<{ name: string; path: string }>
): Node {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function faqSchema(
  faqs: Array<{ question: string; answer: string }>,
  path?: string
): Node {
  return {
    '@type': 'FAQPage',
    ...(path && { '@id': `${absoluteUrl(path)}#faq` }),
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: stripHtml(faq.question),
      acceptedAnswer: { '@type': 'Answer', text: stripHtml(faq.answer) },
    })),
  }
}

export function merchantReturnPolicySchema(): Node {
  return {
    '@type': 'MerchantReturnPolicy',
    '@id': SCHEMA_IDS.returnPolicy,
    applicableCountry: 'IN',
    returnPolicyCategory:
      'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: SITE.policies.returnDays,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
    merchantReturnLink: absoluteUrl('/refund'),
  }
}

export function shippingDetailsSchema(price: number): Node {
  const { freeShippingThreshold, shippingCharge, handlingDays, transitDays } =
    SITE.policies
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: price >= freeShippingThreshold ? 0 : shippingCharge,
      currency: SITE.currency,
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'IN',
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: handlingDays.min,
        maxValue: handlingDays.max,
        unitCode: 'DAY',
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: transitDays.min,
        maxValue: transitDays.max,
        unitCode: 'DAY',
      },
    },
  }
}

/** End of the current year — stable across renders, unlike `now + 1y`. */
function priceValidUntil(): string {
  return `${new Date().getFullYear()}-12-31`
}

export interface ProductSchemaInput {
  id: string
  name: string
  slug: string
  description?: string | null
  short_description?: string | null
  meta_description?: string | null
  price: number | string
  compare_at_price?: number | string | null
  sku?: string | null
  barcode?: string | null
  image?: string | null
  images?: string[] | null
  manufacturer?: string | null
  rating?: number | string | null
  reviews_count?: number | null
  inStock?: boolean
  benefits?: string[] | null
  ingredients?: string | null
  weight?: number | string | null
  product_categories?: { name?: string; slug?: string } | null
}

export function productSchema(product: ProductSchemaInput): Node {
  const url = absoluteUrl(`/products/${product.slug}`)
  const price = Number(product.price)
  const images = [product.image, ...(product.images || [])].filter(
    (src): src is string => typeof src === 'string' && /^https?:\/\//.test(src)
  )
  const rating = Number(product.rating || 0)
  const reviewCount = Number(product.reviews_count || 0)
  const gtin = product.barcode && /^\d{8,14}$/.test(product.barcode)

  return {
    '@type': 'Product',
    '@id': `${url}#product`,
    url,
    name: product.name,
    description: stripHtml(
      product.description || product.meta_description || product.short_description
    ).slice(0, 5000),
    disambiguatingDescription: stripHtml(product.short_description) || undefined,
    image: [...new Set(images)],
    sku: product.sku || product.id,
    ...(gtin && { gtin: product.barcode }),
    mpn: product.sku || undefined,
    brand: { '@type': 'Brand', name: product.manufacturer || SITE.name },
    category: product.product_categories?.name,
    material: product.ingredients || undefined,
    ...(product.weight && {
      weight: {
        '@type': 'QuantitativeValue',
        value: Number(product.weight),
        unitCode: 'GRM',
      },
    }),
    ...(product.benefits?.length && {
      additionalProperty: product.benefits.map((benefit) => ({
        '@type': 'PropertyValue',
        name: 'Benefit',
        value: benefit,
      })),
    }),
    offers: {
      '@type': 'Offer',
      url,
      price: price.toFixed(2),
      priceCurrency: SITE.currency,
      priceValidUntil: priceValidUntil(),
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': SCHEMA_IDS.organization },
      shippingDetails: shippingDetailsSchema(price),
      hasMerchantReturnPolicy: { '@id': SCHEMA_IDS.returnPolicy },
    },
    // Google only accepts aggregateRating backed by real reviews.
    ...(rating > 0 &&
      reviewCount > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: rating.toFixed(1),
          reviewCount,
          bestRating: 5,
          worstRating: 1,
        },
      }),
  }
}

export function itemListSchema(
  items: Array<{ name: string; slug: string; image?: string | null }>,
  { name, path }: { name: string; path: string }
): Node {
  return {
    '@type': 'ItemList',
    '@id': `${absoluteUrl(path)}#itemlist`,
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(`/products/${item.slug}`),
      name: item.name,
    })),
  }
}
