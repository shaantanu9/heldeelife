'use client'

import { Shield, RotateCcw, Truck, Headphones, CheckCircle2 } from 'lucide-react'

const guarantees = [
  {
    icon: Shield,
    title: '100% Authentic Guarantee',
    description:
      'Every product is certified authentic. If you&apos;re not satisfied, we&apos;ll refund 100% of your purchase.',
    highlight: true,
  },
  {
    icon: RotateCcw,
    title: '30-Day Return Policy',
    description:
      'Not happy with your purchase? Return it within 30 days for a full refund, no questions asked.',
  },
  {
    icon: Truck,
    title: 'Free Shipping & Easy Returns',
    description:
      'Free shipping on orders above ₹999. Returns are simple and hassle-free.',
  },
  {
    icon: Headphones,
    title: '24/7 Customer Support',
    description:
      'Our support team is always here to help with any questions or concerns you may have.',
  },
  {
    icon: CheckCircle2,
    title: 'Quality Assured',
    description:
      'All products undergo rigorous quality checks. We stand behind every item we sell.',
  },
]

export function RiskReversal() {
  return (
    <section className="py-24 bg-white">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-600 font-light mb-4">
              SHOP WITH CONFIDENCE
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Your Satisfaction is{' '}
              <span className="text-orange-600">Our Guarantee</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We remove all risk from your purchase with comprehensive guarantees
              and policies designed to give you complete peace of mind.
            </p>
          </div>

          {/* Guarantees Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {guarantees.map((guarantee, index) => {
              const Icon = guarantee.icon
              return (
                <div
                  key={index}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    guarantee.highlight
                      ? 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200 shadow-lg'
                      : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-md'
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-xl ${
                      guarantee.highlight
                        ? 'bg-orange-100'
                        : 'bg-gray-100'
                    } flex items-center justify-center mb-4`}
                  >
                    <Icon
                      className={`h-7 w-7 ${
                        guarantee.highlight
                          ? 'text-orange-600'
                          : 'text-gray-700'
                      }`}
                    />
                  </div>
                  <h3
                    className={`font-bold text-lg mb-2 ${
                      guarantee.highlight
                        ? 'text-orange-900'
                        : 'text-gray-900'
                    }`}
                  >
                    {guarantee.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      guarantee.highlight
                        ? 'text-gray-700'
                        : 'text-gray-600'
                    }`}
                  >
                    {guarantee.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Trust Statement */}
          <div className="bg-gradient-to-r from-gray-50 to-orange-50/30 rounded-2xl p-8 border border-gray-200 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              We Stand Behind Every Product
            </h3>
            <p className="text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Your trust is our most valuable asset. That&apos;s why we offer
              comprehensive guarantees and policies that protect you at every
              step of your wellness journey. Shop with complete confidence.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

