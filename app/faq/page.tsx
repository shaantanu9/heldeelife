import { Card, CardContent } from '@/components/ui/card'
import { HelpCircle } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ | heldeelife',
  description:
    'Find answers to frequently asked questions about heldeelife products, services, orders, shipping, and more.',
}

export const dynamic = 'force-static'

const faqCategories = [
  {
    title: 'General Questions',
    questions: [
      {
        q: 'What is heldeelife?',
        a: 'heldeelife is a holistic health and wellness platform that combines traditional Ayurvedic wisdom with modern medicine. We offer authentic Ayurvedic products, expert medical consultations, and comprehensive health solutions for respiratory and immune health.',
      },
      {
        q: 'Where is heldeelife based?',
        a: 'We are based in Mumbai, Maharashtra, India, and serve customers across the country.',
      },
      {
        q: 'How can I contact customer support?',
        a: 'You can reach us via email at support@heldeelife.com, phone at +91 1800-123-4567, or through our contact form. Our support team is available Monday through Saturday, 9 AM to 6 PM.',
      },
    ],
  },
  {
    title: 'Products',
    questions: [
      {
        q: 'Are your products natural and safe?',
        a: 'Yes, all our products are made with 100% natural ingredients and undergo rigorous quality testing to ensure safety and effectiveness. We follow traditional Ayurvedic formulations backed by scientific research.',
      },
      {
        q: 'Do you offer product samples?',
        a: 'Currently, we don&apos;t offer product samples, but we have a 7-day return policy if you&apos;re not satisfied with your purchase. Please see our Refund Policy for details.',
      },
      {
        q: 'How should I store the products?',
        a: 'Most products should be stored in a cool, dry place away from direct sunlight. Please refer to the product packaging for specific storage instructions.',
      },
      {
        q: 'What is the shelf life of your products?',
        a: 'Shelf life varies by product and is clearly mentioned on the packaging. Most products have a shelf life of 12-24 months when stored properly.',
      },
    ],
  },
  {
    title: 'Orders & Shipping',
    questions: [
      {
        q: 'How long does shipping take?',
        a: 'Shipping times vary by location: Metro cities (3-5 days), Tier 2 cities (5-7 days), Other locations (7-10 days), and Remote areas (10-15 days). Express and same-day delivery options are also available.',
      },
      {
        q: 'What are the shipping charges?',
        a: 'Orders above ₹500 qualify for free shipping. Orders below ₹500 have a ₹50 shipping charge. Express shipping costs an additional ₹99, and same-day delivery costs ₹199 (select cities only).',
      },
      {
        q: 'Can I track my order?',
        a: 'Yes, once your order is shipped, you&apos;ll receive a tracking number via email and SMS. You can track your order through your account dashboard or the tracking link provided.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Currently, we only ship within India. International shipping may be available in the future.',
      },
    ],
  },
  {
    title: 'Returns & Refunds',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'You have 7 days from the date of delivery to initiate a return. Products must be unopened and in original packaging (unless defective). Please see our Refund Policy for complete details.',
      },
      {
        q: 'How long does it take to process a refund?',
        a: 'Refunds are typically processed within 7-14 business days after we receive and inspect the returned product. The time it takes to appear in your account depends on your payment method.',
      },
      {
        q: 'Are shipping charges refundable?',
        a: 'Original shipping charges are refunded only if the return is due to our error (wrong product, defective item, etc.). For change-of-mind returns, shipping charges are non-refundable.',
      },
    ],
  },
  {
    title: 'Consultations',
    questions: [
      {
        q: 'How do I book a consultation?',
        a: 'You can book a consultation through our Service page. Fill out the consultation request form with your preferred date and time, and we&apos;ll confirm your appointment.',
      },
      {
        q: 'What types of consultations do you offer?',
        a: 'We offer General Consultation, Allergy Testing, Respiratory Health Check, Ayurvedic Consultation, and Follow-up Consultations.',
      },
      {
        q: 'Are consultations available online?',
        a: 'Yes, we offer both online and in-person consultations. You can choose your preferred method when booking.',
      },
      {
        q: 'How much do consultations cost?',
        a: 'Consultation fees vary by service type. Please contact us or check our Service page for current pricing information.',
      },
    ],
  },
  {
    title: 'Account & Payments',
    questions: [
      {
        q: 'How do I create an account?',
        a: 'Click on the &quot;Sign Up&quot; button in the header, fill in your details, and verify your email address. You can also sign up during checkout.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept credit cards, debit cards, UPI, digital wallets, and net banking. All payments are processed securely.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes, we use industry-standard encryption and secure payment processing. We never store your complete payment details on our servers.',
      },
      {
        q: 'Can I change my order after placing it?',
        a: 'You can cancel your order before it ships. Once shipped, you can return it after delivery following our return policy.',
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="h-10 w-10 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Frequently Asked{' '}
              <span className="text-orange-600">Questions</span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-12">
            Find answers to common questions about our products, services, and
            policies.
          </p>

          <div className="space-y-8">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {category.title}
                </h2>
                <div className="space-y-4">
                  {category.questions.map((faq, faqIndex) => (
                    <Card
                      key={faqIndex}
                      className="border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          {faq.q}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-4">
              Can&apos;t find the answer you&apos;re looking for? Our support
              team is here to help.
            </p>
            <a
              href="/contact"
              className="inline-block text-orange-600 hover:text-orange-700 font-semibold"
            >
              Contact Us →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

