import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import '@/lib/utils/leaflet-fix'
import { Providers } from '@/components/providers'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MobileNav } from '@/components/layout/mobile-nav'
import { PWAInstaller } from '@/components/pwa/pwa-installer'
import { ExitIntentPopup } from '@/components/conversion/exit-intent-popup'
import { RecentlyViewed } from '@/components/conversion/recently-viewed'
import { AbandonedCartRecovery } from '@/components/conversion/abandoned-cart-recovery'
import { LiveChat } from '@/components/conversion/live-chat'
import { OnboardingTour } from '@/components/mobile/onboarding-tour'
import { NetworkStatus } from '@/components/mobile/network-status'
import { AppClientWrapper } from '@/components/mobile/app-client-wrapper'
import { SmoothScroll } from '@/components/mobile/smooth-scroll'
import { ScrollToTop } from '@/components/mobile/scroll-to-top'
import MobileOptimizations from '@/components/mobile/mobile-optimizations'
import { StickyCartButton } from '@/components/mobile/sticky-cart-button'
import { GoogleAnalytics } from '@/components/analytics/google-analytics'
import { SITE, VERIFICATION } from '@/lib/seo/site'
import { JsonLd } from '@/lib/seo/json-ld'
import { organizationSchema, websiteSchema } from '@/lib/seo/schema'

// Optimize font loading with display swap and preload
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap', // Show fallback font while loading
  preload: true,
  adjustFontFallback: true,
  // Optimize font loading
  fallback: ['system-ui', 'arial'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['Georgia', 'serif'],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline} | Holistic Wellness`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: 'health',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    title: SITE.name,
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    url: '/',
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [
      {
        url: SITE.ogImage,
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [SITE.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // No site-wide canonical here: it would be inherited by every page that
  // doesn't set its own (incl. 404s), pointing them all at the homepage.
  alternates: {
    types: {
      'application/rss+xml': [
        { url: '/rss.xml', title: `${SITE.name} Blog RSS Feed` },
      ],
    },
  },
  verification: {
    google: VERIFICATION.google,
    yandex: VERIFICATION.yandex,
    ...(VERIFICATION.bing && { other: { 'msvalidate.01': VERIFICATION.bing } }),
  },
  other: {
    // Local / geo signals (India)
    'geo.region': `IN-MH`,
    'geo.placename': SITE.address.addressLocality,
    'geo.position': `${SITE.geo.latitude};${SITE.geo.longitude}`,
    ICBM: `${SITE.geo.latitude}, ${SITE.geo.longitude}`,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: SITE.themeColor,
  viewportFit: 'cover', // For iOS safe area
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang={SITE.language} suppressHydrationWarning>
      <head>
        {/* Site-wide entity graph: Organization/OnlineStore + WebSite */}
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />
        <link
          rel="alternate"
          type="text/plain"
          title="LLM-readable site summary"
          href="/llms.txt"
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${inter.className} min-h-screen`}
        suppressHydrationWarning
      >
        <Providers>
          <AppClientWrapper>
            <MobileOptimizations />
            <SmoothScroll />
            <NetworkStatus />
            <Header />
            <main className="pb-16 md:pb-0 safe-area-inset-bottom">
              {children}
            </main>
            <RecentlyViewed />
            <Footer />
            <MobileNav />
            <ScrollToTop />
            <StickyCartButton />
            <PWAInstaller />
            <ExitIntentPopup discountCode="WELCOME10" discountPercentage={10} />
            <OnboardingTour />
            <AbandonedCartRecovery />
            <LiveChat autoOpen={false} delay={60000} />
          </AppClientWrapper>
        </Providers>
        <GoogleAnalytics />
      </body>
    </html>
  )
}
