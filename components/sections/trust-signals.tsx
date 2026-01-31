'use client'

import { Shield, Award, Truck, RotateCcw, CheckCircle2, Star } from 'lucide-react'

const trustSignals = [
  {
    icon: Shield,
    title: '100% Authentic',
    description: 'Certified Ayurvedic products',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: Award,
    title: 'Expert Verified',
    description: 'Doctor-approved formulations',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders above ₹999',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    description: '30-day return policy',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    icon: CheckCircle2,
    title: 'Quality Assured',
    description: 'GMP certified facilities',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    icon: Star,
    title: '4.8/5 Rating',
    description: 'From 10,000+ reviews',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
]

const certifications = [
  { name: 'GMP Certified', logo: '🏭' },
  { name: 'ISO 9001', logo: '✅' },
  { name: 'Ayurvedic License', logo: '🌿' },
  { name: 'FDA Approved', logo: '💊' },
]

export function TrustSignals() {
  return (
    <section className="py-16 bg-white border-y border-gray-100">
      <div className="container px-4">
        {/* Trust Signals Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          {trustSignals.map((signal, index) => {
            const Icon = signal.icon
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`w-16 h-16 rounded-full ${signal.bgColor} flex items-center justify-center mb-3`}
                >
                  <Icon className={`h-8 w-8 ${signal.color}`} />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1">
                  {signal.title}
                </h3>
                <p className="text-xs text-gray-600">{signal.description}</p>
              </div>
            )
          })}
        </div>

        {/* Certifications Bar */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                Certified & Trusted
              </p>
              <p className="text-xs text-gray-600">
                All our products meet the highest quality standards
              </p>
            </div>
            <div className="flex items-center gap-8 flex-wrap justify-center">
              {certifications.map((cert, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2"
                >
                  <span className="text-3xl">{cert.logo}</span>
                  <p className="text-xs text-gray-600 font-medium">
                    {cert.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}









