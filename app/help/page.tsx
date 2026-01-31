import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  HelpCircle,
  Book,
  MessageCircle,
  Phone,
  Mail,
  ArrowRight,
} from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help Center | heldeelife',
  description:
    'Get help with your heldeelife account, orders, products, and services. Find resources and contact our support team.',
}

export const dynamic = 'force-static'

const helpTopics = [
  {
    icon: Book,
    title: 'Getting Started',
    description:
      'New to heldeelife? Learn how to create an account, browse products, and place your first order.',
    link: '/faq',
  },
  {
    icon: MessageCircle,
    title: 'Order Support',
    description:
      'Questions about placing orders, tracking shipments, or managing your purchases?',
    link: '/faq',
  },
  {
    icon: Phone,
    title: 'Product Information',
    description:
      'Learn about our products, ingredients, usage instructions, and health benefits.',
    link: '/shop',
  },
  {
    icon: Mail,
    title: 'Account & Billing',
    description:
      'Manage your account settings, payment methods, and view your order history.',
    link: '/profile',
  },
]

const quickLinks = [
  { title: 'Shipping Policy', link: '/shipping' },
  { title: 'Refund Policy', link: '/refund' },
  { title: 'Privacy Policy', link: '/privacy' },
  { title: 'Terms of Service', link: '/terms' },
  { title: 'Contact Us', link: '/contact' },
  { title: 'FAQ', link: '/faq' },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="h-10 w-10 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Help <span className="text-orange-600">Center</span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-12">
            Find the help you need quickly and easily. Browse our resources or
            contact our support team.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {helpTopics.map((topic, index) => {
              const Icon = topic.icon
              return (
                <Card
                  key={index}
                  className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {topic.title}
                        </h3>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                          {topic.description}
                        </p>
                        <Button
                          variant="ghost"
                          className="text-orange-600 hover:text-orange-700 p-0 h-auto font-semibold"
                          asChild
                        >
                          <Link href={topic.link}>
                            Learn More
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <Card className="border border-gray-200 shadow-xl bg-white">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Quick Links
                </h2>
                <ul className="space-y-3">
                  {quickLinks.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.link}
                        className="text-gray-600 hover:text-orange-600 transition-colors flex items-center gap-2"
                      >
                        <ArrowRight className="h-4 w-4" />
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
                <p className="mb-6 opacity-90">
                  Our customer support team is available to assist you with any
                  questions or concerns.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5" />
                    <a
                      href="mailto:support@heldeelife.com"
                      className="hover:underline"
                    >
                      support@heldeelife.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5" />
                    <a href="tel:+9118001234567" className="hover:underline">
                      +91 1800-123-4567
                    </a>
                  </div>
                  <div className="pt-4 border-t border-orange-500">
                    <p className="text-sm opacity-80 mb-3">Business Hours:</p>
                    <p className="text-sm">
                      Monday - Saturday: 9:00 AM - 6:00 PM
                    </p>
                    <p className="text-sm">Sunday: Closed</p>
                  </div>
                </div>
                <Button
                  className="mt-6 bg-white text-orange-600 hover:bg-orange-50 w-full"
                  asChild
                >
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

