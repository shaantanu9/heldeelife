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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'
  ),
  title: {
    default: 'heldeelife - Ayurveda and Modern Medicine',
    template: '%s | heldeelife',
  },
  description:
    'Holistic approach to health and wellness through Ayurveda, combining traditional wisdom with modern medicine',
  keywords: [
    'ayurveda',
    'health',
    'wellness',
    'medicine',
    'holistic health',
    'natural remedies',
    'ayurvedic products',
    'wellness products',
  ],
  authors: [{ name: 'heldeelife' }],
  creator: 'heldeelife',
  publisher: 'heldeelife',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com',
    siteName: 'heldeelife',
    title: 'heldeelife - Ayurveda and Modern Medicine',
    description: 'Holistic approach to health and wellness through Ayurveda',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'heldeelife - Ayurveda and Modern Medicine',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'heldeelife - Ayurveda and Modern Medicine',
    description: 'Holistic approach to health and wellness through Ayurveda',
    images: [
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'}/og-image.jpg`,
    ],
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
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': [
        { url: '/rss.xml', title: 'heldeelife Blog RSS Feed' },
      ],
    },
  },
  // Additional LLM-friendly metadata
  category: 'Health & Wellness',
  classification: 'E-commerce, Health, Ayurveda',
  other: {
    'application-name': 'heldeelife',
    'apple-mobile-web-app-title': 'heldeelife',
    'format-detection': 'telephone=no',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#FF6B35',
  viewportFit: 'cover', // For iOS safe area
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'

  // Organization structured data for the entire site
  const organizationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'heldeelife',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description:
      'Holistic approach to health and wellness through Ayurveda and modern medicine',
    sameAs: [
      // Add your social media links here when available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['English', 'Hindi'],
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
  }

  // WebSite structured data with search action
  const websiteStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'heldeelife',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="en">
      <head>
        {/* Organization structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
        {/* WebSite structured data with search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData),
          }}
        />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Resource Hints - Optimize loading */}
        {/* Note: Google Fonts preconnect is handled automatically by next/font/google */}
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />

        {/* PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="heldeelife" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        {/* SEO Meta Tags */}
        <meta name="theme-color" content="#FF6B35" />
        <meta name="color-scheme" content="light" />
        <meta name="language" content="English" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />

        {/* LLM-Friendly Meta Tags */}
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />
        <meta name="slurp" content="index, follow" />

        {/* Additional SEO */}
        <meta name="author" content="heldeelife" />
        <meta name="copyright" content="heldeelife" />
        <meta name="reply-to" content="support@heldeelife.com" />
        <meta name="rating" content="general" />
        <meta name="distribution" content="global" />
        <meta name="coverage" content="worldwide" />
        {/* Razorpay Checkout Script */}
        <script
          src="https://checkout.razorpay.com/v1/checkout.js"
          async
          defer
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${inter.className} bg-gradient-to-br from-slate-50 via-white to-orange-50/40 min-h-screen`}
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
