import { buildMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/lib/seo/json-ld'
import { webPageSchema } from '@/lib/seo/schema'
import { SCHEMA_IDS, absoluteUrl } from '@/lib/seo/site'

const consultations = [
  'General Consultation',
  'Allergy Testing',
  'Respiratory Health Check',
  'Ayurvedic Consultation',
  'Follow-up Consultation',
]

export const metadata = buildMetadata({
  title: 'Book an Ayurvedic & Medical Consultation',
  description:
    'Book an online or in-person consultation with heldeelife doctors — Ayurvedic consultation, allergy testing, respiratory health checks and follow-ups across India.',
  path: '/service',
  keywords: [
    'ayurvedic doctor consultation',
    'online ayurveda consultation India',
    'allergy testing',
    'respiratory health check',
  ],
})

export default function ServiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({
            path: '/service',
            name: 'Book a Consultation',
            breadcrumb: [
              { name: 'Home', path: '/' },
              { name: 'Consultations', path: '/service' },
            ],
          }),
          {
            '@type': 'Service',
            name: 'heldeelife health consultations',
            serviceType: 'Health consultation',
            provider: { '@id': SCHEMA_IDS.organization },
            areaServed: { '@type': 'Country', name: 'India' },
            availableChannel: {
              '@type': 'ServiceChannel',
              serviceUrl: absoluteUrl('/service'),
            },
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Consultation types',
              itemListElement: consultations.map((name) => ({
                '@type': 'Offer',
                itemOffered: { '@type': 'Service', name },
              })),
            },
          },
        ]}
      />
      {children}
    </>
  )
}
