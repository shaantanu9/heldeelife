'use client'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'Tara B',
    location: 'Jayanagar, Bangalore',
    image: '👩',
    rating: 5,
    quote:
      'I&apos;ve been using heldeelife products for 6 months now, and the difference is incredible. The authentic Ayurvedic formulations combined with expert doctor consultations have transformed my wellness journey. Highly recommend!',
    verified: true,
  },
  {
    id: 2,
    name: 'Rajesh K',
    location: 'Mumbai, Maharashtra',
    image: '👨',
    rating: 5,
    quote:
      'Finally, a platform that combines traditional wisdom with modern medicine. The quality of products is outstanding, and the customer service is exceptional. This is what authentic Ayurveda should be.',
    verified: true,
  },
  {
    id: 3,
    name: 'Priya S',
    location: 'Delhi, NCR',
    image: '👩',
    rating: 5,
    quote:
      'The personalized consultation with their Ayurvedic doctor helped me understand my dosha and find the right products. The results speak for themselves - I feel more energetic and balanced than ever.',
    verified: true,
  },
]

const stats = [
  { number: '50,000+', label: 'Happy Customers' },
  { number: '4.8/5', label: 'Average Rating' },
  { number: '10,000+', label: 'Verified Reviews' },
  { number: '98%', label: 'Satisfaction Rate' },
]

export function Testimonials() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-orange-50/40">
      <div className="container px-4">
        {/* Header with Social Proof Stats */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-orange-600 font-light mb-4">
            TRUSTED BY THOUSANDS
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            What our <span className="text-orange-600">customers</span> say
          </h2>
          
          {/* Stats Bar */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl font-bold text-gray-900">{stat.number}</p>
                <p className="text-sm text-gray-600 uppercase tracking-wide">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Carousel */}
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent>
            {testimonials.map((testimonial) => (
              <CarouselItem key={testimonial.id} className="md:basis-1/2">
                <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-shadow bg-white">
                  <CardContent className="p-8">
                    {/* Rating Stars */}
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-5 w-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                      {testimonial.verified && (
                        <span className="ml-2 text-xs text-green-600 font-medium flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                          Verified Purchase
                        </span>
                      )}
                    </div>

                    {/* Quote */}
                    <p className="text-lg text-gray-700 leading-relaxed mb-6 italic">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>

                    {/* Customer Info */}
                    <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                        <span className="text-2xl">{testimonial.image}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {testimonial.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {testimonial.location}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="border-gray-300 hover:border-orange-500 text-gray-600 hover:text-orange-600" />
          <CarouselNext className="border-gray-300 hover:border-orange-500 text-gray-600 hover:text-orange-600" />
        </Carousel>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Join thousands of satisfied customers on their wellness journey
          </p>
          <a
            href="/shop"
            className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors"
          >
            Start Your Journey
            <span>→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
