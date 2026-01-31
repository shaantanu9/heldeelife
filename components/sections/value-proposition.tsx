'use client'

import { Heart, Brain, Leaf, Sparkles, Users, Clock } from 'lucide-react'

const values = [
  {
    icon: Heart,
    title: 'Holistic Wellness',
    description:
      'Complete health solutions that address mind, body, and spirit through authentic Ayurvedic principles.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    icon: Brain,
    title: 'Expert Guidance',
    description:
      'Consult with certified Ayurvedic doctors and modern medicine practitioners for personalized care.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Leaf,
    title: '100% Natural',
    description:
      'Pure, authentic ingredients sourced directly from trusted suppliers, free from harmful chemicals.',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: Sparkles,
    title: 'Modern Innovation',
    description:
      'Traditional wisdom enhanced with modern research and quality standards for optimal results.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    icon: Users,
    title: 'Community Support',
    description:
      'Join thousands of wellness enthusiasts on their journey to better health and vitality.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Clock,
    title: 'Proven Results',
    description:
      'Time-tested formulations backed by centuries of Ayurvedic knowledge and modern validation.',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
]

export function ValueProposition() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-orange-50/20">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-600 font-light mb-4">
              WHY CHOOSE HELDEELIFE
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Your Trusted Partner in{' '}
              <span className="text-orange-600">Holistic Health</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              We combine ancient Ayurvedic wisdom with modern medicine to
              deliver authentic, effective, and personalized wellness solutions
              for your complete well-being.
            </p>
          </div>

          {/* Values Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div
                  key={index}
                  className="group p-8 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all duration-300"
                >
                  <div
                    className={`w-14 h-14 rounded-xl ${value.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`h-7 w-7 ${value.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <p className="text-lg text-gray-600 mb-6">
              Ready to start your wellness journey?
            </p>
            <a
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Explore Our Products
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}









