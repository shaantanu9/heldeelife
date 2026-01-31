'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { Clock, Users, Award, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

const promotions = [
  {
    id: 1,
    title: 'Find Your Allergy Trigger with heldeelife Expert!',
    subtitle: 'Personalized Allergy Consultation',
    description:
      'Get expert diagnosis and personalized treatment plan from certified allergists. Book your consultation today.',
    buttonText: 'Book Consultation',
    buttonVariant: 'default' as const,
    bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
    textColor: 'text-gray-900',
    icon: '👩‍⚕️',
    urgency: 'Limited slots available today',
    benefits: ['Expert diagnosis', 'Personalized plan', 'Follow-up support'],
    badge: 'Most Popular',
  },
  {
    id: 2,
    title: 'Travelling Soon? Protect Yourself from Flu',
    subtitle: 'Travel Wellness Pack',
    description:
      'Essential immunity boosters and preventive care for your journey. Stay healthy while traveling.',
    buttonText: 'Add to Cart',
    buttonVariant: 'default' as const,
    bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
    textColor: 'text-gray-900',
    icon: '✈️',
    urgency: 'Best seller this week',
    benefits: ['Travel-ready', 'Natural protection', 'Easy to carry'],
    badge: 'Best Seller',
  },
  {
    id: 3,
    title: 'Get Your Sinus/Asthma Diagnostic Pack!',
    subtitle: 'Complete Diagnostic Solution',
    description:
      'Comprehensive diagnostic pack for sinus and asthma conditions. Get expert consultation included.',
    buttonText: 'Add to Cart',
    buttonVariant: 'default' as const,
    bgColor: 'bg-gradient-to-br from-orange-600 to-orange-700',
    textColor: 'text-white',
    icon: '😤',
    urgency: 'Special offer - Limited time',
    benefits: ['Complete diagnosis', 'Expert consultation', 'Treatment plan'],
    badge: 'Special Offer',
  },
]

export function Promotions() {
  const { addToCart } = useCart()

  const handleAddToCart = (productName: string) => {
    // Add sample product to cart
    addToCart({
      id: `promo-${Date.now()}`,
      name: productName,
      price: 199.0,
      image: '📦',
    })
  }

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-orange-50/20">
      <div className="container px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-600 font-light mb-4">
              SPECIAL OFFERS
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Exclusive{' '}
              <span className="text-orange-600">Wellness Solutions</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Limited-time offers and expert consultations to support your
              wellness journey.
            </p>
          </div>

          {/* Promotions Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {promotions.map((promo) => (
              <Card
                key={promo.id}
                className={`${promo.bgColor} ${promo.textColor} border-2 border-transparent hover:border-orange-300 shadow-lg hover:shadow-2xl transition-all duration-300 group`}
              >
                <CardContent className="p-8 flex flex-col h-full">
                  {/* Badge */}
                  {promo.badge && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-semibold mb-4 w-fit">
                      <Sparkles className="h-3 w-3 text-orange-600" />
                      <span className="text-orange-600">{promo.badge}</span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className="text-7xl md:text-8xl mb-6 opacity-80 group-hover:scale-110 transition-transform">
                    {promo.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-2 opacity-80">
                      {promo.subtitle}
                    </p>
                    <h3
                      className={`text-2xl font-bold mb-4 leading-tight ${promo.textColor}`}
                    >
                      {promo.title}
                    </h3>
                    <p
                      className={`text-sm mb-6 leading-relaxed ${
                        promo.textColor === 'text-white'
                          ? 'text-white/90'
                          : 'text-gray-700'
                      }`}
                    >
                      {promo.description}
                    </p>

                    {/* Benefits */}
                    <div className="space-y-2 mb-6">
                      {promo.benefits.map((benefit, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Award
                            className={`h-4 w-4 ${
                              promo.textColor === 'text-white'
                                ? 'text-white/80'
                                : 'text-orange-600'
                            }`}
                          />
                          <span
                            className={
                              promo.textColor === 'text-white'
                                ? 'text-white/90'
                                : 'text-gray-700'
                            }
                          >
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Urgency */}
                    <div className="flex items-center gap-2 mb-6 p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {promo.urgency}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  {promo.buttonText === 'Book Consultation' ? (
                    <Button
                      size="lg"
                      className={`rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 w-full ${
                        promo.textColor === 'text-white'
                          ? 'bg-white text-orange-600 hover:bg-gray-50'
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                      asChild
                    >
                      <Link href="/service">
                        {promo.buttonText}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className={`rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 w-full ${
                        promo.textColor === 'text-white'
                          ? 'bg-white text-orange-600 hover:bg-gray-50'
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                      onClick={() => handleAddToCart(promo.title)}
                    >
                      {promo.buttonText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
