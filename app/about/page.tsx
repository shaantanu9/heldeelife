import { Card, CardContent } from '@/components/ui/card'
import { Heart, Leaf, Users, Award } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | heldeelife',
  description:
    'Learn about heldeelife - combining traditional Ayurvedic wisdom with modern medicine to provide holistic wellness products and expert consultations.',
}

export const dynamic = 'force-static'

const values = [
  {
    icon: Leaf,
    title: 'Natural & Ayurvedic',
    description:
      'We believe in the power of nature and traditional Ayurvedic wisdom combined with modern science.',
  },
  {
    icon: Heart,
    title: 'Holistic Wellness',
    description:
      'Our approach focuses on complete wellness - physical, mental, and spiritual health.',
  },
  {
    icon: Users,
    title: 'Expert Care',
    description:
      'Our team of experienced doctors and practitioners provide personalized care and guidance.',
  },
  {
    icon: Award,
    title: 'Quality Assured',
    description:
      'All our products undergo rigorous quality testing to ensure safety and effectiveness.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About <span className="text-orange-600">heldeelife</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            heldeelife is dedicated to bringing you the best of Ayurveda and
            modern medicine. We combine ancient wisdom with contemporary
            healthcare solutions to provide holistic wellness products and
            services.
          </p>

          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              To make holistic health and wellness accessible to everyone
              through authentic Ayurvedic products and expert medical
              consultation. We strive to bridge the gap between traditional
              healing practices and modern healthcare needs.
            </p>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Our Values
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon
                return (
                  <Card
                    key={index}
                    className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white"
                  >
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-orange-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {value.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Why Choose heldeelife?
            </h2>
            <ul className="space-y-4 text-lg text-gray-600">
              <li className="flex items-start gap-3">
                <span className="text-orange-600 mt-1 font-bold">✓</span>
                <span>
                  Authentic Ayurvedic formulations backed by scientific research
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 mt-1 font-bold">✓</span>
                <span>
                  Expert consultations with qualified doctors and Ayurvedic
                  practitioners
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 mt-1 font-bold">✓</span>
                <span>
                  100% natural ingredients with no harmful side effects
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 mt-1 font-bold">✓</span>
                <span>
                  Comprehensive health solutions for respiratory and immune
                  health
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 mt-1 font-bold">✓</span>
                <span>Easy online consultation and doorstep delivery</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
