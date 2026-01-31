'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Gift, CheckCircle2, ArrowRight } from 'lucide-react'
import { useState } from 'react'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle newsletter subscription
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setEmail('')
    }, 3000)
  }

  return (
    <section className="py-24 bg-gradient-to-br from-orange-600 to-orange-700 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 50 L90 10 L50 50 L10 10 Z' fill='%23FFFFFF'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="container px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          {/* Left: Visual Elements */}
          <div className="relative hidden md:block">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/30">
                  <span className="text-5xl block text-center">📦</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/30">
                  <span className="text-5xl block text-center">🫙</span>
                </div>
              </div>
              <div className="space-y-6 pt-12">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/30">
                  <span className="text-5xl block text-center">🩹</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/30">
                  <span className="text-5xl block text-center">💊</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: CTA Content */}
          <div className="text-white space-y-8">
            {/* Header */}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-orange-100 font-light mb-4">
                STAY INFORMED
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
                Did You Know Most OTC Nasal Sprays Cause Rebound Congestion?
              </h2>
              <p className="text-lg opacity-90 leading-relaxed mb-6">
                Subscribe to our newsletter for expert health insights, wellness
                tips, and exclusive offers. Get{' '}
                <span className="font-bold">₹100 heldeelife Cash</span> on
                subscription.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3 mb-6">
              {[
                'Weekly health insights from experts',
                'Exclusive discounts and offers',
                'Early access to new products',
                'Personalized wellness tips',
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-200 flex-shrink-0" />
                  <span className="text-white/90">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Newsletter Form */}
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-12 h-12 bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-white text-orange-600 hover:bg-gray-50 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 h-12 px-6"
                  >
                    Subscribe
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-white/80">
                  By subscribing, you agree to our privacy policy. Unsubscribe
                  anytime.
                </p>
              </form>
            ) : (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 border border-white/30">
                <div className="flex items-center gap-3 text-white">
                  <CheckCircle2 className="h-6 w-6 text-green-300" />
                  <div>
                    <p className="font-semibold">Thank you for subscribing!</p>
                    <p className="text-sm text-white/90">
                      Check your email for your ₹100 cash reward.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Alternative CTA */}
            <div className="pt-6 border-t border-white/20">
              <p className="text-white/90 mb-4">
                Prefer to consult with an expert instead?
              </p>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 w-full md:w-auto"
                asChild
              >
                <a href="/service">
                  <Gift className="mr-2 h-4 w-4" />
                  Book Free Consultation
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
