import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

import { getProductCategories } from '@/lib/api/server'

type CategoryDecoration = {
  icon: string
  description: string
  benefits: string[]
  featured?: boolean
}

// Presentation details keyed by category slug (see product_categories seed data)
const categoryDecorations: Record<string, CategoryDecoration> = {
  'cold-relief': {
    icon: '🤧',
    description: 'Natural solutions for cold symptoms',
    benefits: ['Fast relief', '100% natural', 'No side effects'],
  },
  'cough-relief': {
    icon: '😷',
    description: 'Effective cough management',
    benefits: ['Soothes throat', 'Reduces irritation', 'Ayurvedic formula'],
  },
  'immunity-booster': {
    icon: '💪',
    description:
      "Strengthen your immune system naturally with our Ayurvedic solutions. Boost your body's natural defense mechanisms.",
    benefits: [
      'Natural ingredients',
      'Long-term benefits',
      'Doctor recommended',
    ],
    featured: true,
  },
  'digestive-health': {
    icon: '🌿',
    description: 'Support your digestive wellness',
    benefits: ['Improves digestion', 'Reduces bloating', 'Natural enzymes'],
  },
  'skin-care': {
    icon: '✨',
    description: 'Radiant skin with Ayurvedic care',
    benefits: ['Glowing skin', 'Natural ingredients', 'Proven results'],
  },
  'wellness-essentials': {
    icon: '🧘',
    description: 'Complete wellness solutions',
    benefits: ['Holistic approach', 'Daily wellness', 'Expert curated'],
  },
}

const defaultDecoration: CategoryDecoration = {
  icon: '🌱',
  description: 'Authentic Ayurvedic wellness products',
  benefits: ['Natural ingredients', 'Quality assured'],
}

type CategoryCard = CategoryDecoration & {
  id: string
  name: string
  slug: string
}

async function loadCategories(): Promise<CategoryCard[]> {
  const rows = (await getProductCategories()) as Array<{
    id: string
    name: string
    slug: string
    description?: string | null
    is_active?: boolean | null
  }>

  return rows
    .filter((row) => row.slug && row.is_active !== false)
    .map((row) => {
      const decoration = categoryDecorations[row.slug] || {
        ...defaultDecoration,
        description: row.description || defaultDecoration.description,
      }
      return { ...decoration, id: row.id, name: row.name, slug: row.slug }
    })
}

export async function Categories() {
  const categories = await loadCategories()

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="py-24 bg-white">
      <div className="container px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-600 font-light mb-4">
              SHOP BY CATEGORY
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Find Your{' '}
              <span className="text-orange-600">Wellness Solution</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Explore our curated collection of authentic Ayurvedic and modern
              medicine products, organized by category to help you find exactly
              what you need.
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${encodeURIComponent(category.slug)}`}
              >
                <Card
                  className={`h-full border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                    category.featured
                      ? 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200'
                      : 'bg-white'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`text-5xl flex-shrink-0 ${
                          category.featured ? 'scale-110' : ''
                        } transition-transform group-hover:scale-110`}
                      >
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-bold text-xl mb-2 ${
                            category.featured
                              ? 'text-orange-900'
                              : 'text-gray-900'
                          }`}
                        >
                          {category.name}
                        </h3>
                      </div>
                    </div>

                    <p
                      className={`text-sm mb-4 leading-relaxed ${
                        category.featured ? 'text-gray-700' : 'text-gray-600'
                      }`}
                    >
                      {category.description}
                    </p>

                    {/* Benefits */}
                    <div className="space-y-2 mb-4">
                      {category.benefits.map((benefit, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                          <span
                            className={
                              category.featured
                                ? 'text-gray-700'
                                : 'text-gray-600'
                            }
                          >
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm group-hover:gap-3 transition-all">
                      <span>Explore Products</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center">
            <Button
              size="lg"
              variant="outline"
              className="rounded-lg border-2 border-orange-600 text-orange-600 hover:bg-orange-50 font-semibold shadow-md hover:shadow-lg transition-all duration-200 px-8"
              asChild
            >
              <Link href="/shop">View All Categories</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
