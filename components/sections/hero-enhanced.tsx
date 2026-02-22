'use client'

import { ChevronDown, ArrowRight, Shield, Award, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function HeroEnhanced() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 50 L90 10 L50 50 L10 10 Z' fill='%23EA580C'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
          {/* Left Content - AIDA Framework Applied */}
          <div className="space-y-8">
            {/* Attention: Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full text-sm text-orange-700 font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Trusted by 50,000+ customers</span>
            </div>

            {/* Interest: Headline with Value Proposition */}
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-orange-600 font-light">
                AUTHENTIC AYURVEDA • MODERN CARE
              </p>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                Authentic Ayurveda and Modern Care for a{' '}
                <span className="text-orange-600">Healthier You</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 max-w-xl leading-relaxed font-light">
                Whether you&apos;re building a daily routine or need expert
                guidance, we&apos;re here with authentic products and
                doctor-backed care—so you can feel your best, for good.
              </p>
            </div>

            {/* Desire: Key Benefits */}
            <div className="grid sm:grid-cols-3 gap-4 py-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    Authentic
                  </p>
                  <p className="text-xs text-gray-600">
                    Certified products
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Award className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    Expert Care
                  </p>
                  <p className="text-xs text-gray-600">
                    Doctor consultations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    Trusted
                  </p>
                  <p className="text-xs text-gray-600">
                    50K+ happy customers
                  </p>
                </div>
              </div>
            </div>

            {/* Action: Strong CTAs with Fitts' Law */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all text-base px-8 py-6 h-auto"
              >
                <Link href="/shop">
                  Shop Authentic Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-gray-300 hover:border-orange-500 text-gray-700 hover:text-orange-600 text-base px-8 py-6 h-auto"
              >
                <Link href="/about">Learn Our Story</Link>
              </Button>
            </div>

            {/* Social Proof: Quick Stats */}
            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-gray-200">
              <div>
                <p className="text-2xl font-bold text-gray-900">50K+</p>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Happy Customers
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">4.8★</p>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Average Rating
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">500+</p>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Products
                </p>
              </div>
            </div>
          </div>

          {/* Right Image - Visual Appeal */}
          <div className="relative">
            <div className="relative z-10">
              {/* Placeholder for woman image */}
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-orange-100/50 to-orange-50/30 flex items-center justify-center overflow-hidden shadow-2xl">
                <div className="w-full h-full bg-gradient-to-br from-white to-orange-50/20 rounded-3xl flex items-center justify-center">
                  <span className="text-8xl opacity-60">🧘</span>
                </div>
              </div>
            </div>
            {/* Decorative Elements - Gestalt Continuity */}
            <div className="absolute top-10 right-10 w-40 h-40 bg-orange-200/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 left-10 w-32 h-32 bg-orange-100/40 rounded-full blur-2xl" />
            
            {/* Floating Trust Badge */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">
                    Certified Authentic
                  </p>
                  <p className="text-xs text-gray-600">Ayurvedic Products</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Text - Brand Identity */}
        <div className="absolute bottom-0 left-0 right-0 text-center z-0 pointer-events-none">
          <p className="text-[120px] md:text-[200px] lg:text-[280px] font-serif font-light text-orange-50/30 select-none leading-none">
            Wellness
          </p>
        </div>
      </div>

      {/* Scroll Indicator - Zeigarnik Effect */}
      <div className="absolute bottom-12 right-12 flex flex-col items-center gap-2 z-20">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
          Explore More
        </p>
        <ChevronDown className="h-5 w-5 text-orange-600/60 animate-bounce" />
      </div>
    </section>
  )
}









