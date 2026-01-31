import { Products } from '@/components/sections/products-server'
import { Categories } from '@/components/sections/categories'
import { DailyDeals } from '@/components/sections/daily-deals'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import type { Metadata } from 'next'

// Lazy load components for better initial load performance
const HeroEnhanced = dynamic(
  () =>
    import('@/components/sections/hero-enhanced').then((mod) => ({
      default: mod.HeroEnhanced,
    })),
  {
    loading: () => <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40" />,
    ssr: true,
  }
)

const TrustSignals = dynamic(
  () =>
    import('@/components/sections/trust-signals').then((mod) => ({
      default: mod.TrustSignals,
    })),
  {
    loading: () => <div className="py-16 bg-white" />,
    ssr: true,
  }
)

const ValueProposition = dynamic(
  () =>
    import('@/components/sections/value-proposition').then((mod) => ({
      default: mod.ValueProposition,
    })),
  {
    loading: () => <div className="py-24 bg-gradient-to-br from-slate-50 via-white to-orange-50/20" />,
    ssr: true,
  }
)

const ProblemSolution = dynamic(
  () =>
    import('@/components/sections/problem-solution').then((mod) => ({
      default: mod.ProblemSolution,
    })),
  {
    loading: () => <div className="py-24 bg-white" />,
    ssr: true,
  }
)
const Promotions = dynamic(
  () =>
    import('@/components/sections/promotions').then((mod) => ({
      default: mod.Promotions,
    })),
  {
    loading: () => <div className="py-12 bg-white" />,
    ssr: true,
  }
)

const Testimonials = dynamic(
  () =>
    import('@/components/sections/testimonials').then((mod) => ({
      default: mod.Testimonials,
    })),
  {
    loading: () => <div className="py-12 bg-white" />,
    ssr: true,
  }
)

const BrandStory = dynamic(
  () =>
    import('@/components/sections/brand-story').then((mod) => ({
      default: mod.BrandStory,
    })),
  {
    loading: () => <div className="py-12 bg-white" />,
    ssr: true,
  }
)

const RiskReversal = dynamic(
  () =>
    import('@/components/sections/risk-reversal').then((mod) => ({
      default: mod.RiskReversal,
    })),
  {
    loading: () => <div className="py-12 bg-white" />,
    ssr: true,
  }
)

const Doctors = dynamic(
  () =>
    import('@/components/sections/doctors').then((mod) => ({
      default: mod.Doctors,
    })),
  {
    loading: () => <div className="py-12 bg-white" />,
    ssr: true,
  }
)

const Insights = dynamic(
  () =>
    import('@/components/sections/insights').then((mod) => ({
      default: mod.Insights,
    })),
  {
    loading: () => <div className="py-12 bg-white" />,
    ssr: true,
  }
)

const Newsletter = dynamic(
  () =>
    import('@/components/sections/newsletter').then((mod) => ({
      default: mod.Newsletter,
    })),
  {
    loading: () => <div className="py-12 bg-white" />,
    ssr: true,
  }
)

// Route segment config for ISR
export const revalidate = 60 // Revalidate every 60 seconds

export const metadata: Metadata = {
  title: 'heldeelife - Authentic Ayurveda & Modern Medicine | Holistic Wellness',
  description:
    'Experience the perfect blend of ancient Ayurvedic wisdom and modern medicine. Authentic products, expert guidance, and personalized care for your complete well-being. Trusted by 50,000+ customers.',
}

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* AIDA Framework Applied: Attention, Interest, Desire, Action */}
      
      {/* 1. HERO - Attention & Interest (AIDA: A, I) */}
      <HeroEnhanced />
      
      {/* 2. TRUST SIGNALS - Build Credibility Immediately */}
      <TrustSignals />
      
      {/* 3. VALUE PROPOSITION - Desire (AIDA: D) */}
      <ValueProposition />
      
      {/* 4. PROBLEM-SOLUTION - Address Pain Points */}
      <ProblemSolution />
      
      {/* 5. PRODUCTS - Show Solutions (Action: A) */}
      <DailyDeals />
      <Suspense fallback={<div className="py-24 bg-white" />}>
        <Products />
      </Suspense>
      <Categories />
      
      {/* 6. PROMOTIONS - Urgency & Scarcity */}
      <Promotions />
      
      {/* 7. TESTIMONIALS - Social Proof */}
      <Testimonials />
      
      {/* 8. BRAND STORY - Authenticity & Trust */}
      <BrandStory />
      
      {/* 9. RISK REVERSAL - Remove Objections */}
      <RiskReversal />
      
      {/* 10. DOCTORS - Authority & Expertise */}
      <Doctors />
      
      {/* 11. INSIGHTS - Education & Value */}
      <Insights />
      
      {/* 12. NEWSLETTER - Lead Capture */}
      <Newsletter />
    </div>
  )
}
