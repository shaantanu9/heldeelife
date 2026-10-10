/**
 * Single source of truth for site identity, NAP (name / address / phone)
 * and social profiles. Every SEO surface — metadata, JSON-LD, robots,
 * sitemap, llms.txt — reads from here so search engines and AI answer
 * engines see one consistent entity.
 *
 * Business details can be overridden per deployment through env vars
 * without code changes (see .env.example).
 */

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

const env = (key: string): string | undefined => {
  const value = process.env[key]
  return value && value.trim() !== '' ? value.trim() : undefined
}

export const SITE_URL = normalizeUrl(
  env('NEXT_PUBLIC_SITE_URL') || 'https://heldeelife.com'
)

export const SITE = {
  name: 'heldeelife',
  legalName: env('NEXT_PUBLIC_BUSINESS_LEGAL_NAME') || 'heldeelife',
  url: SITE_URL,
  tagline: 'Authentic Ayurveda & Modern Medicine',
  description:
    'heldeelife is an Indian online wellness store combining authentic Ayurvedic remedies with modern medicine — natural products for immunity, respiratory health and everyday well-being, delivered across India.',
  shortDescription:
    'Authentic Ayurvedic and modern wellness products, delivered across India.',
  locale: 'en_IN',
  language: 'en-IN',
  currency: 'INR',
  themeColor: '#FF6B35',
  logo: `${SITE_URL}/logo.png`,
  ogImage: `${SITE_URL}/og-image.jpg`,
  foundingDate: env('NEXT_PUBLIC_BUSINESS_FOUNDING_YEAR') || '2024',
  contact: {
    email: env('NEXT_PUBLIC_SUPPORT_EMAIL') || 'support@heldeelife.com',
    phone: env('NEXT_PUBLIC_SUPPORT_PHONE') || '+91-1800-123-4567',
    hours: 'Mo-Sa 09:00-18:00',
    hoursLabel: 'Monday – Saturday, 9:00 AM – 6:00 PM IST',
  },
  address: {
    streetAddress: env('NEXT_PUBLIC_BUSINESS_STREET') || '',
    addressLocality: env('NEXT_PUBLIC_BUSINESS_CITY') || 'Mumbai',
    addressRegion: env('NEXT_PUBLIC_BUSINESS_REGION') || 'Maharashtra',
    postalCode: env('NEXT_PUBLIC_BUSINESS_POSTAL_CODE') || '400001',
    addressCountry: 'IN',
  },
  geo: {
    latitude: Number(env('NEXT_PUBLIC_BUSINESS_LAT') || 19.076),
    longitude: Number(env('NEXT_PUBLIC_BUSINESS_LNG') || 72.8777),
  },
  areaServed: 'India',
  policies: {
    freeShippingThreshold: 500,
    shippingCharge: 50,
    returnDays: 7,
    handlingDays: { min: 1, max: 2 },
    transitDays: { min: 3, max: 15 },
  },
  social: [
    env('NEXT_PUBLIC_SOCIAL_INSTAGRAM'),
    env('NEXT_PUBLIC_SOCIAL_FACEBOOK'),
    env('NEXT_PUBLIC_SOCIAL_X'),
    env('NEXT_PUBLIC_SOCIAL_YOUTUBE'),
    env('NEXT_PUBLIC_SOCIAL_LINKEDIN'),
  ].filter((v): v is string => Boolean(v)),
  keywords: [
    'ayurveda',
    'ayurvedic products online',
    'buy ayurvedic medicine online India',
    'natural immunity booster',
    'herbal remedies',
    'respiratory health',
    'holistic wellness',
    'modern medicine',
  ],
} as const

/** Stable @id anchors so JSON-LD nodes across pages reference one entity. */
export const SCHEMA_IDS = {
  organization: `${SITE_URL}/#organization`,
  website: `${SITE_URL}/#website`,
  returnPolicy: `${SITE_URL}/refund#policy`,
  logo: `${SITE_URL}/#logo`,
} as const

/** Make a site-relative path absolute. Absolute URLs pass through. */
export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

/** Search-engine verification tokens, only emitted when configured. */
export const VERIFICATION = {
  google: env('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION'),
  bing: env('NEXT_PUBLIC_BING_SITE_VERIFICATION'),
  yandex: env('NEXT_PUBLIC_YANDEX_VERIFICATION'),
}
