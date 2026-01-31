import { Card, CardContent } from '@/components/ui/card'
import { Truck, Package, Clock, MapPin, Shield } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shipping Policy | heldeelife',
  description:
    'Learn about heldeelife&apos;s shipping policy, delivery times, shipping charges, and order tracking information.',
}

export const dynamic = 'force-static'

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Shipping <span className="text-orange-600">Policy</span>
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Shipping Information
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                At heldeelife, we are committed to delivering your orders safely
                and on time. This policy outlines our shipping practices,
                delivery times, and related information.
              </p>
            </section>

            <section>
              <Card className="border border-gray-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Shipping Locations
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        We currently ship to all major cities and towns across
                        India. Shipping is available to all pin codes serviced
                        by our logistics partners.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <Card className="border border-gray-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Processing Time
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-3">
                        Orders are typically processed within 1-2 business days
                        (Monday through Saturday, excluding holidays).
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-600">
                        <li>Standard orders: 1-2 business days</li>
                        <li>Custom or personalized items: 3-5 business days</li>
                        <li>
                          Orders placed after 2 PM may be processed the next
                          business day
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <Card className="border border-gray-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Truck className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Delivery Time
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-3">
                        Delivery times vary based on your location and the
                        shipping method selected:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-600">
                        <li>
                          <strong>Metro Cities:</strong> 3-5 business days
                        </li>
                        <li>
                          <strong>Tier 2 Cities:</strong> 5-7 business days
                        </li>
                        <li>
                          <strong>Other Locations:</strong> 7-10 business days
                        </li>
                        <li>
                          <strong>Remote Areas:</strong> 10-15 business days
                        </li>
                      </ul>
                      <p className="text-gray-600 leading-relaxed mt-3">
                        Delivery times are estimates and may be affected by
                        weather conditions, holidays, or other factors beyond
                        our control.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <Card className="border border-gray-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Shipping Methods
                      </h3>
                      <div className="space-y-3 text-gray-600">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Standard Shipping (Free)
                          </p>
                          <p>
                            Available for orders above ₹500. Delivery in 5-10
                            business days.
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Express Shipping
                          </p>
                          <p>
                            ₹99 additional charge. Delivery in 2-4 business days
                            for metro cities.
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Same-Day Delivery
                          </p>
                          <p>
                            Available in select metro cities. ₹199 additional
                            charge. Order before 12 PM for same-day delivery.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <Card className="border border-gray-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Shipping Charges
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-600">
                        <li>
                          Orders above ₹500: <strong>Free shipping</strong>
                        </li>
                        <li>Orders below ₹500: ₹50 shipping charge</li>
                        <li>Express shipping: Additional ₹99</li>
                        <li>
                          Same-day delivery: Additional ₹199 (select cities
                          only)
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Order Tracking
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Once your order is shipped, you will receive a tracking number
                via email and SMS. You can track your order status in real-time
                through:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Your account dashboard</li>
                <li>
                  The tracking link provided in your shipping confirmation email
                </li>
                <li>Our customer support team</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Delivery Issues
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Failed Delivery
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                If delivery fails due to incorrect address, recipient
                unavailable, or other reasons:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>We will attempt delivery up to 3 times</li>
                <li>
                  After 3 failed attempts, the order will be returned to us
                </li>
                <li>You may be charged for return shipping</li>
                <li>Contact us within 24 hours to reschedule delivery</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
                Damaged or Lost Packages
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                If your package arrives damaged or is lost in transit:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>
                  Contact us immediately with photos of the damaged package
                </li>
                <li>
                  We will investigate and provide a replacement or full refund
                </li>
                <li>Claims must be filed within 7 days of delivery</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                International Shipping
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Currently, we only ship within India. International shipping may
                be available in the future. Please check back or contact us for
                updates.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Contact Us
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                For questions about shipping or to track your order, please
                contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-900 font-semibold mb-2">
                  heldeelife Shipping Support
                </p>
                <p className="text-gray-600">
                  Email:{' '}
                  <a
                    href="mailto:shipping@heldeelife.com"
                    className="text-orange-600 hover:underline"
                  >
                    shipping@heldeelife.com
                  </a>
                </p>
                <p className="text-gray-600">Phone: +91 1800-123-4567</p>
                <p className="text-gray-600">
                  Hours: Monday - Saturday, 9 AM - 6 PM
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
