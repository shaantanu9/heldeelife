'use client'

import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const problems = [
  {
    icon: AlertCircle,
    problem: 'Confused about which products are authentic?',
    solution:
      'We source directly from certified Ayurvedic manufacturers and provide complete transparency about ingredients and certifications.',
  },
  {
    icon: AlertCircle,
    problem: 'Struggling with generic health solutions?',
    solution:
      'Get personalized consultations with our expert doctors who understand both Ayurvedic and modern medicine approaches.',
  },
  {
    icon: AlertCircle,
    problem: 'Concerned about product quality and safety?',
    solution:
      'All products are GMP certified, tested for purity, and backed by our 30-day satisfaction guarantee.',
  },
  {
    icon: AlertCircle,
    problem: 'Finding it hard to balance traditional and modern medicine?',
    solution:
      'We bridge the gap by offering both authentic Ayurvedic products and modern medicine, with expert guidance on how to use them together safely.',
  },
]

export function ProblemSolution() {
  return (
    <section className="py-24 bg-white">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-600 font-light mb-4">
              WE UNDERSTAND YOUR CHALLENGES
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Common Problems,{' '}
              <span className="text-orange-600">Simple Solutions</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We&apos;ve identified the key challenges people face in their
              wellness journey and created solutions that actually work.
            </p>
          </div>

          {/* Problems & Solutions */}
          <div className="space-y-8 mb-12">
            {problems.map((item, index) => {
              const ProblemIcon = item.icon
              return (
                <div
                  key={index}
                  className="grid md:grid-cols-2 gap-8 items-center p-8 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-orange-200 transition-all"
                >
                  {/* Problem */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                      <ProblemIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {item.problem}
                      </h3>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:flex justify-center">
                    <ArrowRight className="h-6 w-6 text-orange-600" />
                  </div>

                  {/* Solution */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-gray-700 leading-relaxed">
                        {item.solution}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA */}
          <div className="text-center p-8 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl border border-orange-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Solve Your Health Challenges?
            </h3>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Join thousands who have found their path to holistic wellness
              with heldeelife.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Link href="/shop">Shop Now</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-gray-300"
              >
                <Link href="/contact">Consult a Doctor</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}









