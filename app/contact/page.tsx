import { Card, CardContent } from '@/components/ui/card'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { ContactForm } from '@/components/contact/contact-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | heldeelife',
  description:
    'Get in touch with heldeelife customer support. Contact us via email, phone, or fill out our contact form.',
}

export const dynamic = 'force-static'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Contact <span className="text-orange-600">Us</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl">
            Have questions or need assistance? We&apos;re here to help. Reach
            out to us through any of the channels below.
          </p>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <ContactForm />

            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="border border-gray-200 shadow-xl bg-white">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Get in Touch
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Email
                        </h4>
                        <p className="text-gray-600">support@heldeelife.com</p>
                        <p className="text-gray-600">info@heldeelife.com</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Phone
                        </h4>
                        <p className="text-gray-600">+91 1800-123-4567</p>
                        <p className="text-gray-600">+91 98765-43210</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Address
                        </h4>
                        <p className="text-gray-600">
                          heldeelife Headquarters
                          <br />
                          Mumbai, Maharashtra 400001
                          <br />
                          India
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Business Hours
                        </h4>
                        <p className="text-gray-600">
                          Monday - Saturday: 9:00 AM - 6:00 PM
                        </p>
                        <p className="text-gray-600">Sunday: Closed</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-orange-600 to-orange-700 text-white">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-4">
                    Need Immediate Help?
                  </h3>
                  <p className="mb-4 opacity-90">
                    For urgent inquiries or product-related questions, our
                    customer support team is available during business hours.
                  </p>
                  <p className="text-sm opacity-80">
                    Average response time: Within 24 hours
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
