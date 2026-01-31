'use client'

import { Heart, Target, Users, Award } from 'lucide-react'

const storyPoints = [
  {
    icon: Heart,
    title: 'Our Mission',
    description:
      'To make authentic Ayurvedic and modern medicine accessible to everyone, bridging ancient wisdom with modern healthcare needs.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    icon: Target,
    title: 'Our Vision',
    description:
      'To become India&apos;s most trusted platform for holistic wellness, where tradition meets innovation for complete health.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Users,
    title: 'Our Values',
    description:
      'Authenticity, transparency, care, and innovation guide everything we do. Your wellness is our commitment.',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: Award,
    title: 'Our Promise',
    description:
      'Every product is authentic, every consultation is expert, and every interaction is designed to support your wellness journey.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
]

export function BrandStory() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-orange-50/40">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-600 font-light mb-4">
              OUR STORY
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              More Than a Brand —{' '}
              <span className="text-orange-600">A Commitment</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              heldeelife was born from a simple belief: everyone deserves access
              to authentic, effective, and personalized wellness solutions. We
              combine the timeless wisdom of Ayurveda with modern medical
              expertise to create a holistic approach to health.
            </p>
          </div>

          {/* Story Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Left: Image Placeholder */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center overflow-hidden shadow-xl">
                <div className="text-center p-8">
                  <span className="text-8xl mb-4 block">🌿</span>
                  <p className="text-gray-600 font-medium">
                    Authentic Ayurvedic Heritage
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Story Text */}
            <div className="space-y-6">
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg">
                  In a world where wellness has become complex and confusing, we
                  saw the need for a trusted partner. A platform that respects
                  the ancient traditions of Ayurveda while embracing the
                  precision of modern medicine.
                </p>
                <p className="text-gray-700 leading-relaxed text-lg">
                  Our team of Ayurvedic doctors, modern medicine practitioners,
                  and wellness experts work together to ensure every product and
                  consultation meets the highest standards of authenticity and
                  effectiveness.
                </p>
                <p className="text-gray-700 leading-relaxed text-lg">
                  We&apos;re not just selling products—we&apos;re building a
                  community of wellness enthusiasts who believe in the power of
                  holistic health.
                </p>
              </div>
            </div>
          </div>

          {/* Values Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {storyPoints.map((point, index) => {
              const Icon = point.icon
              return (
                <div
                  key={index}
                  className="p-6 bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all"
                >
                  <div
                    className={`w-12 h-12 rounded-lg ${point.bgColor} flex items-center justify-center mb-4`}
                  >
                    <Icon className={`h-6 w-6 ${point.color}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    {point.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {point.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <a
              href="/about"
              className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors"
            >
              Learn More About Us
              <span>→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

