'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, BookOpen, FileText, Video, Download } from 'lucide-react'

const resources = [
  {
    id: 1,
    title: 'Understanding Ayurveda',
    description:
      'Learn about the ancient science of Ayurveda and its principles for holistic health.',
    type: 'Article',
    icon: BookOpen,
    link: '#',
  },
  {
    id: 2,
    title: 'Respiratory Health Guide',
    description:
      'Comprehensive guide to maintaining healthy respiratory function naturally.',
    type: 'PDF',
    icon: FileText,
    link: '#',
  },
  {
    id: 3,
    title: 'Immunity Boosting Tips',
    description: 'Video series on natural ways to boost your immune system.',
    type: 'Video',
    icon: Video,
    link: '#',
  },
  {
    id: 4,
    title: 'Product Usage Guide',
    description:
      'Detailed instructions on how to use our products effectively.',
    type: 'PDF',
    icon: Download,
    link: '#',
  },
  {
    id: 5,
    title: 'Ayurvedic Lifestyle',
    description:
      'Tips for incorporating Ayurvedic principles into your daily life.',
    type: 'Article',
    icon: BookOpen,
    link: '#',
  },
  {
    id: 6,
    title: 'Seasonal Health Tips',
    description: 'How to adapt your health routine according to seasons.',
    type: 'Article',
    icon: BookOpen,
    link: '#',
  },
]

export default function ResourcePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          <span className="text-orange-600">Resources</span>
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl">
          Access educational content, guides, and resources to help you on your
          wellness journey.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => {
            const Icon = resource.icon
            return (
              <Card
                key={resource.id}
                className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white group"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <Icon className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-orange-600 font-semibold">
                        {resource.type}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {resource.description}
                  </p>
                  <Button
                    variant="ghost"
                    className="text-orange-600 hover:text-orange-700 p-0 h-auto font-semibold"
                    asChild
                  >
                    <Link href={resource.link}>
                      Read More
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
